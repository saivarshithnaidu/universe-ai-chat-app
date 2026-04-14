import { runModelsParallel, callSingleModel, callOpenRouterAgent } from '@/lib/openrouter';
import { getModelById } from '@/lib/models';
import { detectMCPTool, executeMCPTool } from '@/lib/mcp/registry';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/sanitize';
import { queryRAG } from '@/lib/pdf-parser';

// Force ignore SSL errors for local dev stability
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
        console.log(`[API Chat] Request from User ID: ${userId} (Email: ${session?.user?.email})`);
        
        if (!userId) {
             console.error("[API Chat] Rejected: No User ID found in session");
             return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

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
            const agentResult = await callOpenRouterAgent(messages, CODE_AGENT_PROMPT);
            if (agentResult.project?.files) {
                await db.updateChatProjectFiles(chatId, agentResult.project);
            }
            await db.saveMessage(chatId, 'assistant', agentResult.text, agentResult.modelUsed, agentResult.status, false);
            return Response.json({ results: [agentResult], chatId });
        }

        // ── Step 4: Finalize response ────────────────────
        const isCompareMode = viewMode === 'compare';
        
        let results: any[] = [];
        if (isCompareMode) {
            const parallel = await runModelsParallel(selectedModels, messages, CHAT_SYSTEM_PROMPT);
            results = parallel.all;
        } else {
            const modelToCall = preferredModel || selectedModels[0] || 'gpt-4o-mini';
            const single = await callSingleModel(modelToCall, messages, CHAT_SYSTEM_PROMPT);
            results = [single];
        }

        // Save last assistant response to DB
        if (results.length > 0 && results[0].status === 'success') {
            await db.saveMessage(chatId, 'assistant', results[0].text, results[0].modelId || results[0].id, 'success', false);
        }

        return Response.json({ results, chatId });

    } catch (error: any) {
        console.error("!!! [Route Critical Error] !!!");
        console.error("Message:", error?.message);
        console.error("Stack:", error?.stack);
        return Response.json({ 
            error: "Internal Server Error", 
            details: error?.message,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 });
    }
}
