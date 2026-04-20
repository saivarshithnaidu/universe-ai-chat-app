import { getModelById } from '@/lib/models';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/sanitize';

// Force ignore SSL errors for local dev stability
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const maxDuration = 60;

const CHAT_SYSTEM_PROMPT =
    `You are a helpful, direct AI assistant. Answer clearly and concisely. Use markdown for code blocks and lists when helpful.`;

// ─── Key Pools (duplicated for isolation) ─────────────────────────────────────

function getFreeKey(): string | null {
    const rawKeys = process.env.OPENROUTER_FREE_KEYS ||
        process.env.OPENROUTER_API_KEY ||
        process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
}

function getPaidKey(): string | null {
    return process.env.OPENROUTER_PAID_KEY || process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null;
}

// ─── SSE Encoder Helper ───────────────────────────────────────────────────────

function sseEncode(event: string, data: any): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            messages,
            selectedModels = ['gpt-4o-mini'],
            preferredModel,
            chatId: providedChatId,
            mode: rawMode = 'chat',
            viewMode = 'best',
            connectorTokens = {},
            enabledConnectorIds = [],
        } = body;

        const lastUserMessage = messages?.[messages.length - 1];
        if (!lastUserMessage?.content) {
            return Response.json({ error: "Empty message" }, { status: 400 });
        }

        const userInput = lastUserMessage.content;
        let chatId = providedChatId;

        // ── Step 1: Hybrid Tool Engine — non-streamable, return JSON ──────────
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

            // Tool results are not streamable — return as JSON
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

        // ── Step 2: Persist user message ────────────────────────────────────
        if (!chatId) {
            const chat = await db.createChat(userId, userInput.slice(0, 60));
            chatId = chat.id;
        }
        await db.saveMessage(chatId, 'user', sanitizeUserInput(userInput));

        // ── Step 3: Agent Mode — non-streamable, return JSON ──────────────────
        if (rawMode === 'agent') {
            const { callOpenRouterAgent } = await import('@/lib/openrouter');
            const CODE_AGENT_PROMPT = `You are an elite full-stack AI engineer. Return ONLY valid JSON with projectName, framework, and files.`;
            const agentResult = await callOpenRouterAgent(messages, CODE_AGENT_PROMPT);
            if (agentResult.project?.files) {
                await db.updateChatProjectFiles(chatId, agentResult.project);
            }
            await db.saveMessage(chatId, 'assistant', agentResult.text, agentResult.modelUsed, agentResult.status, false);
            return Response.json({ results: [agentResult], chatId });
        }

        // ── Step 4: Streaming Chat Response ──────────────────────────────────
        const isCompareMode = viewMode === 'compare' && selectedModels.length > 1;

        // For compare mode, we stream each model separately with model-tagged events
        const modelsToStream = isCompareMode
            ? selectedModels
            : [preferredModel || selectedModels[0] || 'gpt-4o-mini'];

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send chatId first
                    controller.enqueue(encoder.encode(sseEncode('meta', { chatId })));

                    // Stream all models in parallel
                    const streamPromises = modelsToStream.map(async (modelKey: string) => {
                        const modelDef = getModelById(modelKey);
                        const modelId = modelDef ? modelDef.modelId : modelKey;
                        const isPremium = modelDef ? !!modelDef.isPremium : false;

                        const apiKey = isPremium ? getPaidKey() : getFreeKey();
                        if (!apiKey) {
                            controller.enqueue(encoder.encode(sseEncode('error', {
                                modelKey,
                                modelId,
                                error: 'No API key available',
                            })));
                            return;
                        }

                        let lastError: string | null = null;

                        for (let attempt = 1; attempt <= 2; attempt++) {
                            try {
                                const abortController = new AbortController();
                                const timeout = setTimeout(() => abortController.abort(), 50000);

                                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`,
                                        'HTTP-Referer': 'https://universalai.co.in',
                                        'X-Title': 'Universe AI',
                                    },
                                    body: JSON.stringify({
                                        model: modelId,
                                        messages: [
                                            { role: 'system', content: CHAT_SYSTEM_PROMPT },
                                            ...messages.slice(-10),
                                        ],
                                        max_tokens: 2048,
                                        temperature: 0.7,
                                        stream: true,
                                    }),
                                    signal: abortController.signal,
                                });

                                clearTimeout(timeout);

                                if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    const errMsg = errorData?.error?.message || `HTTP ${response.status}`;
                                    throw new Error(errMsg);
                                }

                                if (!response.body) {
                                    throw new Error('No response body');
                                }

                                const reader = response.body.getReader();
                                const decoder = new TextDecoder();
                                let fullText = '';
                                let buffer = '';

                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;

                                    buffer += decoder.decode(value, { stream: true });
                                    const lines = buffer.split('\n');
                                    buffer = lines.pop() || '';

                                    for (const line of lines) {
                                        const trimmed = line.trim();
                                        if (!trimmed || !trimmed.startsWith('data: ')) continue;

                                        const data = trimmed.slice(6);
                                        if (data === '[DONE]') continue;

                                        try {
                                            const parsed = JSON.parse(data);
                                            const delta = parsed.choices?.[0]?.delta?.content;
                                            if (delta) {
                                                fullText += delta;
                                                controller.enqueue(encoder.encode(sseEncode('chunk', {
                                                    modelKey,
                                                    modelId,
                                                    delta,
                                                })));
                                            }
                                        } catch {
                                            // Skip malformed JSON lines
                                        }
                                    }
                                }

                                // Emit done event for this model
                                controller.enqueue(encoder.encode(sseEncode('model_done', {
                                    modelKey,
                                    modelId,
                                    fullText,
                                })));

                                // Persist to DB
                                await db.saveMessage(chatId, 'assistant', fullText, modelId, 'success', false);

                                // Success — don't retry
                                lastError = null;
                                break;

                            } catch (err: any) {
                                lastError = err.message;
                                console.warn(`[Stream] ${modelId} attempt ${attempt} failed: ${err.message}`);
                                if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
                            }
                        }

                        // If all retries failed, send error for this model
                        if (lastError) {
                            controller.enqueue(encoder.encode(sseEncode('error', {
                                modelKey,
                                modelId,
                                error: lastError,
                            })));
                        }
                    });

                    await Promise.all(streamPromises);

                    // Signal all models are done
                    controller.enqueue(encoder.encode(sseEncode('done', {})));
                    controller.close();

                } catch (err: any) {
                    console.error('[Stream] Fatal error:', err.message);
                    try {
                        controller.enqueue(encoder.encode(sseEncode('error', {
                            error: err.message,
                        })));
                        controller.close();
                    } catch {
                        // Controller already closed
                    }
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error: any) {
        console.error("!!! [Stream Route Critical Error] !!!", error?.message);
        return Response.json({
            error: "Internal Server Error",
            details: error?.message,
        }, { status: 500 });
    }
}
