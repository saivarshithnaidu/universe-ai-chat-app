import { openrouter } from '@/lib/openrouter';
import { stripMarkdown } from '@/lib/markdown-stripper';
import { getModelById } from '@/lib/models';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sanitizeUserInput } from '@/lib/sanitize';
import { validateMessage, validateModelIds, validateRequestBody } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';

export const maxDuration = 120; // 2 minutes to allow sequential processing

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeResponse(choice: any): string {
    if (!choice) return "";
    // Handle various structures
    // 1. OpenAI standard: choice.message.content
    // 2. Direct text: choice.text (some legacy wrappers)
    // 3. Google/Vertex raw: choice.output_text (rare via OpenRouter but possible)
    let content = choice.message?.content || choice.text || choice.output_text || "";

    if (Array.isArray(content)) {
        // Flatten or join text parts
        content = content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');
    }

    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return text ? text.trim() : "";
}

async function generateWithRetry(
    modelKey: string,
    messages: any[],
    retries = 2
): Promise<any> {
    const model = getModelById(modelKey);
    if (!model) throw new Error('Invalid model selected');

    // STRICT VALIDATION: Ensure content is string
    const validatedMessages = messages.map((m: any) => {
        let content = m.content;
        if (Array.isArray(content)) {
            // Flatten or join text parts
            content = content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join('\n');
        }
        return {
            role: m.role,
            content: typeof content === 'string' ? content : JSON.stringify(content)
        };
    });

    // Add system instruction for response control
    const messagesWithInstruction = [
        {
            role: 'system',
            content: 'Respond in approximately 180–220 words. Do not use markdown formatting. Keep response clean and paragraph formatted.'
        },
        ...validatedMessages
    ];

    const TIMEOUT_MS = 30000; // 30s timeout per model

    try {
        // Unified Pipeline
        if (model.provider === 'OpenAI') {
            // Internal OpenAI Route
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const res = await fetch('http://localhost:3000/api/chat/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: messagesWithInstruction,
                        modelId: modelKey
                    }),
                    signal: controller.signal
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'OpenAI API Failed');
                }

                const data = await res.json();

                return {
                    id: model.id,
                    name: model.name,
                    description: model.description,
                    text: data.text || "", // Ensure not undefined
                    status: 'success'
                };
            } finally {
                clearTimeout(timeoutId);
            }
        }

        // OpenRouter Pipeline via OpenAI SDK
        const completionPromise = openrouter.chat.completions.create({
            model: model.modelId,
            messages: messagesWithInstruction,
        });

        // Race against timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), TIMEOUT_MS)
        );

        const completion: any = await Promise.race([completionPromise, timeoutPromise]);

        const choice = completion.choices?.[0];
        if (!choice) {
            throw new Error("Empty response from OpenRouter");
        }

        const normalizedText = normalizeResponse(choice);

        return {
            id: model.id,
            name: model.name,
            description: model.description,
            text: normalizedText,
            status: 'success'
        };

    } catch (err: any) {
        // Detect 400 Bad Request / ZodError
        const isBadRequest = err.status === 400 || (err.error && err.error.code === 400) || err.message?.includes("400");

        if (isBadRequest) {
            console.error(`Model ${modelKey} caused 400 Bad Request. NOT RETRYING.`, err);
            throw new Error(`Conversation format error (400): ${err.message}`);
        }

        if (retries > 0) {
            console.warn(`Model ${modelKey} failed (Remaining retries: ${retries}). Error: ${err.message}`);
            // Wait a bit before retry? 
            // We do sequential processing now, so a small sync delay here is okay or just recursion.
            return generateWithRetry(modelKey, messages, retries - 1);
        }

        console.error(`Model ${modelKey} failed permanently.`, err);
        throw err;
    }
}

// Fallback logic
const getFallbackModel = (modelId: string) => {
    if (modelId === 'gemini-flash') return 'llama-3.1-8b';
    if (modelId === 'phi-3-medium') return 'mixtral-8x7b';
    return null;
};

import { rateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
    // 1. Check DB Config
    try {
        const user = await currentUser();
        const { userId } = await auth();

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("Missing OPENROUTER_API_KEY");
            return Response.json({
                error: "AI Service Unavailable (Configuration)",
                code: "SERVICE_UNAVAILABLE"
            }, { status: 503 });
        }

        if (!userId || !user) {
            return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
        }

        // Rate Limiting
        let userRecord = null;
        try {
            userRecord = await db.getUser(userId);
            if (!userRecord) {
                await db.upsertUser(userId, user.emailAddresses[0]?.emailAddress);
            }
        } catch (e) {
            console.error("DB Error: Failed to fetch/upsert user", e);
        }

        const isPremium = userRecord?.is_premium || false;

        const { success } = await rateLimiter.check(userId, isPremium);
        if (!success) {
            return Response.json({
                error: "Rate limit exceeded. Please try again later.",
                code: "RATE_LIMIT_EXCEEDED"
            }, { status: 429 });
        }

        // Stats
        db.incrementMessageCount(userId).catch(e => console.error("Stats error", e));

        const body = await req.json();

        // Validate request body size
        const bodySizeCheck = validateRequestBody(body);
        if (!bodySizeCheck.valid) {
            return Response.json({ error: bodySizeCheck.error }, { status: 400 });
        }

        const { messages, selectedModels, chatId: providedChatId, modelHistories } = body;

        // Validate messages array
        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages are required' }, { status: 400 });
        }

        // Validate message content
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage?.role === 'user') {
            const messageValidation = validateMessage(lastUserMessage.content);
            if (!messageValidation.valid) {
                return Response.json({ error: messageValidation.error }, { status: 400 });
            }
        }

        // Validate model selection
        const modelValidation = validateModelIds(selectedModels);
        if (!modelValidation.valid) {
            return Response.json({ error: modelValidation.error }, { status: 400 });
        }

        // -------------------------
        // CONCURRENCY & MODEL LIMITS
        // -------------------------
        let maxModels = 4;
        if (!isPremium) {
            maxModels = 3; // Allow up to 3 for comparison as requested by user
        }

        const modelsToUse = selectedModels.slice(0, maxModels);
        // -------------------------

        // -------------------------
        // PREMIUM TRIAL LOGIC
        // -------------------------
        const TRIAL_LIMIT = 5;
        let isUsingPremium = false;

        for (const modelId of modelsToUse) {
            const m = getModelById(modelId);
            if (m?.isPremium) {
                isUsingPremium = true;
                break;
            }
        }

        let dbUser = userRecord;
        if (isUsingPremium) {
            if (!dbUser) {
                dbUser = await db.getUser(userId);
            }

            if (dbUser) {
                const userPremium = dbUser.is_premium || false;
                const trialUsed = dbUser.premium_trial_used || 0;

                if (!userPremium && trialUsed >= TRIAL_LIMIT) {
                    return Response.json({
                        error: 'Premium trial exhausted',
                        code: 'TRIAL_EXHAUSTED'
                    }, { status: 403 });
                }
            }
        }
        // -------------------------

        // 2. Handle Chat ID
        let chatId = providedChatId;

        try {
            if (!chatId) {
                const title = lastUserMessage.content.slice(0, 50) + (lastUserMessage.content.length > 50 ? '...' : '');
                const newChat = await db.createChat(userId, title);
                chatId = newChat.id;
            } else {
                // Verify chat belongs to user (SECURITY CHECK)
                const chat = await db.getChat(chatId);
                if (!chat || chat.user_id !== userId) {
                    return Response.json({ error: 'Unauthorized access to chat' }, { status: 403 });
                }
            }

            if (lastUserMessage.role === 'user' && lastUserMessage.content) {
                // Sanitize user input before saving (XSS protection)
                const sanitizedContent = sanitizeUserInput(lastUserMessage.content);
                await db.saveMessage(chatId, 'user', sanitizedContent);
            }
        } catch (dbError) {
            console.error("DB Error (non-fatal):", dbError);
        }

        // Track if we successfully generated at least one PREMIUM response
        let hasSuccessfulPremiumGeneration = false;
        const results = [];

        // -------------------------
        // SEQUENTIAL EXECUTION LOOP
        // -------------------------
        for (const modelKey of modelsToUse) {
            // Delay between models to avoid rate limits (except for first one)
            if (results.length > 0) {
                await delay(1200);
            }

            let result;
            const modelDef = getModelById(modelKey);
            const modelMessages = (modelHistories && modelHistories[modelKey]) || messages;

            try {
                // Try Primary Model
                result = await generateWithRetry(modelKey, modelMessages);

                // Validate Success
                if (result && result.status === 'success') {
                    // Normalize ID just in case
                    result.id = modelKey;

                    if (modelDef?.isPremium) {
                        hasSuccessfulPremiumGeneration = true;
                    }
                }
            } catch (err: any) {
                console.warn(`Model ${modelKey} failed: ${err.message}`);

                // Try Fallback ONLY on actual error/timeout/empty response
                const fallbackId = getFallbackModel(modelKey);
                if (fallbackId) {
                    console.log(`Attempting fallback from ${modelKey} -> ${fallbackId}`);
                    try {
                        const fallbackResult = await generateWithRetry(fallbackId, modelMessages, 1);

                        // Only use fallback if it actually succeeded with content
                        if (fallbackResult && fallbackResult.status === 'success' && fallbackResult.text && fallbackResult.text.trim().length > 0) {
                            // CRITICAL: Preserve ORIGINAL Model Identity
                            result = {
                                id: modelKey, // KEEP ORIGINAL ID
                                name: modelDef?.name || modelKey,
                                description: modelDef?.description,
                                text: stripMarkdown(fallbackResult.text), // Strip markdown from fallback
                                status: 'success',
                                note: `Fallback from ${modelKey} to ${fallbackId}`,
                                fallbackUsed: true,
                                fallbackModel: fallbackId
                            };
                        }
                    } catch (fallbackErr) {
                        console.error(`Fallback ${fallbackId} also failed.`);
                    }
                }

                if (!result) {
                    // Final failure state
                    result = {
                        id: modelKey,
                        name: modelDef?.name || modelKey,
                        status: 'failed',
                        error: 'Model busy or unavailable',
                        reason: err.message
                    };
                }
            }

            // 4. Save Assistant Response if success
            // STRICT CHECK: Only save if we have valid text
            if (result.status === 'success' && chatId) {
                if (result.text && result.text.trim().length > 0) {
                    try {
                        // Strip markdown before saving to database
                        const cleanText = stripMarkdown(result.text);
                        // CRITICAL: Always use 'modelKey' (the requested ID) for DB persistence
                        // This prevents DB corruption where a fallback ID overwrites the original column
                        await db.saveMessage(chatId, 'assistant', cleanText, modelKey);
                    } catch (dbErr) {
                        console.error(`DB Error saving response for ${modelKey}:`, dbErr);
                    }
                } else {
                    console.warn(`Skipping DB save for model ${modelKey}: Output is empty.`);
                }
            }

            results.push(result);
        }

        // -------------------------
        // INCREMENT TRIAL USAGE
        // -------------------------
        if (isUsingPremium && hasSuccessfulPremiumGeneration && dbUser) {
            const isPremium = dbUser.is_premium || false;
            if (!isPremium) {
                try {
                    await db.incrementTrialUsage(userId);
                } catch (e) {
                    console.error("Failed to increment trial usage", e);
                }
            }
        }
        // -------------------------

        return Response.json({ results, chatId });
    } catch (error: any) {
        console.error("Chat API CRITICAL Error:", error);
        return Response.json({
            error: "Internal Server Error",
            code: "INTERNAL_ERROR",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
