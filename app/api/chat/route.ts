import { runModelsParallel, callSingleModel } from '@/lib/openrouter';
import { handleGeminiAgent } from '@/lib/gemini';
import { getModelById } from '@/lib/models';
import { detectMCPTool, executeMCPTool } from '@/lib/mcp/registry';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/sanitize';
import { queryRAG } from '@/lib/pdf-parser';

// ─── Config ───────────────────────────────────────────────────────────────────
export const maxDuration = 60;

const CHAT_SYSTEM_PROMPT =
    `You are a helpful, direct AI assistant. Answer clearly and concisely. Use markdown for code blocks and lists when helpful.`;

const CODE_AGENT_PROMPT =
    `You are an elite full-stack AI engineer. Return ONLY valid JSON with projectName, framework, and files.`;

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            messages,
            selectedModels = ['gpt-4o-mini'],
            preferredModel,
            chatId: providedChatId,
            mode: rawMode = 'chat',
            viewMode = 'best',          // 'best' | 'compare'
            forceToolKey,               // Optional: UI can force a specific tool
        } = body;

        const lastUserMessage = messages?.[messages.length - 1];
        if (!lastUserMessage?.content) {
            return Response.json({ error: "Empty message" }, { status: 400 });
        }

        const userInput = lastUserMessage.content;
        let chatId = providedChatId;

        // Connector tokens and enabled toggles are sent by the client
        const connectorTokens: Record<string, string> = body.connectorTokens || {};
        const enabledConnectorIds: string[] = body.enabledConnectorIds || [];

        // ── Step 1: Hybrid Tool Engine (Regex + AI Fallback) ────────────────
        const { processHybridTool } = await import('@/lib/mcp/engine');
        const toolResult = rawMode !== 'agent' 
            ? await processHybridTool(userInput, { enabledConnectorIds, tokens: connectorTokens, userId }) 
            : null;

        if (toolResult) {
            if (!chatId) {
                const chat = await db.createChat(userId, userInput.slice(0, 60));
                chatId = chat.id;
            }
            await db.saveMessage(chatId, 'user', sanitizeUserInput(userInput));
            await db.saveMessage(chatId, 'assistant', toolResult.text, toolResult.tool, toolResult.status, false);

            return Response.json({
                results: [{
                    id: toolResult.tool,
                    type: toolResult.type === 'tool' ? 'mcp_tool' : 'error',
                    connector: toolResult.connector,
                    status: toolResult.status,
                    text: toolResult.text,
                    toolName: toolResult.tool,
                    toolKey: toolResult.tool,
                    data: toolResult.data,
                    error: toolResult.type === 'error' ? toolResult.text : null,
                }],
                chatId,
            });
        }

        // ── Step 2: Persist user message (Standard Chat) ────────────────────
        if (!chatId) {
            const chat = await db.createChat(userId, userInput.slice(0, 60));
            chatId = chat.id;
        }
        await db.saveMessage(chatId, 'user', sanitizeUserInput(userInput));

        // ── Step 3: Agent Mode ────────────────────────────────────────────────
        if (rawMode === 'agent') {
            const agentResult = await handleGeminiAgent(messages, CODE_AGENT_PROMPT);
            if (agentResult.project?.files) {
                await db.updateChatProjectFiles(chatId, agentResult.project);
            }
            await db.saveMessage(chatId, 'assistant', agentResult.text, agentResult.modelUsed, agentResult.status, false);
            return Response.json({ results: [agentResult], chatId });
        }

        // ── Step 4: LLM Execution — branched by viewMode ──────────────────────
        let systemPrompt = CHAT_SYSTEM_PROMPT;
        if (rawMode === 'docs') {
            try {
                const ctx = await queryRAG(userInput, userId);
                if (ctx) systemPrompt += `\n\nDocument context:\n${ctx}`;
            } catch {}
        }

        const validModels = (selectedModels as string[])
            .filter(key => !!getModelById(key))
            .slice(0, 3);
        const modelsToRun = validModels.length > 0 ? validModels : ['gpt-4o-mini'];

        // ── BEST MODE: One model ───────────────────────────────────────────────
        if (viewMode === 'best') {
            const modelToUse = (preferredModel && validModels.includes(preferredModel))
                ? preferredModel
                : modelsToRun[0];
            try {
                const result = await callSingleModel(modelToUse, messages, systemPrompt, 25000);
                await db.saveMessage(chatId, 'assistant', result.text, result.id, 'success', false);
                return Response.json({ results: [result], chatId });
            } catch (err: any) {
                const modelDef = getModelById(modelToUse);
                return Response.json({
                    results: [{
                        id: modelToUse,
                        type: 'llm',
                        status: 'failed',
                        text: `⚠️ ${modelDef?.name || modelToUse} failed to respond. Please retry.`,
                        modelId: modelDef?.modelId || modelToUse,
                        error: err.message,
                    }],
                    chatId,
                });
            }
        }

        // ── COMPARE MODE: All models in parallel ──────────────────────────────
        const { best, all } = await runModelsParallel(modelsToRun, messages, systemPrompt, 25000);
        if (best) {
            await db.saveMessage(chatId, 'assistant', best.text, best.id, 'success', false);
        }
        return Response.json({ results: all, chatId });

    } catch (error: any) {
        console.error("[Route] Critical:", error?.message);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
