import { openrouter } from '@/lib/openrouter';

import { getModelById } from '@/lib/models';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export const maxDuration = 30;

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    try {
        // Unified Pipeline
        if (model.provider === 'OpenAI') {
            // Internal OpenAI Route
            const res = await fetch('http://localhost:3000/api/chat/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: validatedMessages,
                    modelId: modelKey
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'OpenAI API Failed');

            return {
                id: model.id,
                name: model.name,
                description: model.description,
                text: data.text,
                status: 'success'
            };
        }

        // OpenRouter Pipeline via OpenAI SDK
        const completion = await openrouter.chat.completions.create({
            model: model.modelId,
            messages: validatedMessages,
        });

        const choice = completion.choices[0];
        if (!choice || !choice.message) {
            throw new Error("Empty response from OpenRouter");
        }

        return {
            id: model.id,
            name: model.name,
            description: model.description,
            text: choice.message.content || "",
            status: 'success'
        };

    } catch (err: any) {
        // Detect 400 Bad Request / ZodError
        const isBadRequest = err.status === 400 || (err.error && err.error.code === 400) || err.message.includes("400");

        if (isBadRequest) {
            console.error(`Model ${modelKey} caused 400 Bad Request. NOT RETRYING.`, err);
            // Return a specific error structure to be handled cleanly
            throw new Error(`Conversation format error (400): ${err.message}`);
        }

        if (retries > 0) {
            console.warn(`Model ${modelKey} failed (Remaining retries: ${retries}). Error: ${err.message}`);
            await delay(1000); // Wait 1s
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
    // For now we assume if Prisma is set up, we try to save.
    // If DATABASE_URL is missing, Prisma will throw, handled by try/catch.

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
            // Ensure user exists (sync)
            if (!userRecord) {
                await db.upsertUser(userId, user.emailAddresses[0]?.emailAddress);
            }
        } catch (e) {
            console.error("DB Error: Failed to fetch/upsert user", e);
            // Continue execution, userRecord stays null -> isPremium=false
        }

        const isPremium = userRecord?.is_premium || false;

        const { success, remaining } = await rateLimiter.check(userId, isPremium);
        if (!success) {
            return Response.json({
                error: "Rate limit exceeded. Please try again later.",
                code: "RATE_LIMIT_EXCEEDED"
            }, { status: 429 });
        }

        // Stats
        db.incrementMessageCount(userId).catch(e => console.error("Stats error", e));

        const body = await req.json();
        const { messages, selectedModels, chatId: providedChatId, modelHistories } = body;

        // Basic validation
        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages are required' }, { status: 400 });
        }

        if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
            return Response.json({ error: 'No models selected' }, { status: 400 });
        }

        // Limit models to 4
        const modelsToUse = selectedModels.slice(0, 4);

        // -------------------------
        // PREMIUM TRIAL LOGIC
        // -------------------------
        const TRIAL_LIMIT = 5;
        let isUsingPremium = false;

        // Check if any selected model is premium
        for (const modelId of modelsToUse) {
            const m = getModelById(modelId);
            if (m?.isPremium) {
                isUsingPremium = true;
                break;
            }
        }

        let dbUser = null;
        if (isUsingPremium) {
            // Fetch latest user state
            try {
                dbUser = await db.getUser(userId);
                if (!dbUser) {
                    // Try sync if missing
                    await db.upsertUser(userId, user.emailAddresses[0]?.emailAddress);
                    dbUser = await db.getUser(userId);
                }
            } catch (e) {
                console.error("DB Error: Failed to refresh user state for premium check", e);
                // We proceed. If dbUser is null, premium trial check might get skipped or handled gracefully implicitly.
                // Lines 145+ handle "if (dbUser)" so it should be safe.
            }

            if (dbUser) {
                const isPremium = dbUser.is_premium || false;
                const trialUsed = dbUser.premium_trial_used || 0;

                if (!isPremium && trialUsed >= TRIAL_LIMIT) {
                    return Response.json({
                        error: 'Premium trial exhausted',
                        code: 'TRIAL_EXHAUSTED'
                    }, { status: 403 });
                }
            }
        }
        // -------------------------


        // 1. Sync User (if not already fetched/synced above)
        if (!dbUser) {
            try {
                const email = user.emailAddresses[0]?.emailAddress;
                await db.upsertUser(userId, email);
            } catch (e) { console.error("DB User Sync failed", e); }
        }

        // 2. Handle Chat ID
        let chatId = providedChatId;
        const lastUserMessage = messages[messages.length - 1];

        try {
            if (!chatId) {
                // Create new chat
                const title = lastUserMessage.content.slice(0, 50) + (lastUserMessage.content.length > 50 ? '...' : '');
                const newChat = await db.createChat(userId, title);
                chatId = newChat.id;
            }

            // 3. Save User Message
            if (lastUserMessage.role === 'user') {
                await db.saveMessage(chatId, 'user', lastUserMessage.content);
            }
        } catch (dbError) {
            console.error("DB Error (non-fatal):", dbError);
        }

        // Track if we successfully generated at least one PREMIUM response for accounting
        let hasSuccessfulPremiumGeneration = false;

        const results = await Promise.all(
            modelsToUse.map(async (modelKey: string) => {
                let result;
                const modelDef = getModelById(modelKey);
                // Use specific history for this model if available, otherwise fallback to shared messages
                const modelMessages = (modelHistories && modelHistories[modelKey]) || messages;
                try {
                    result = await generateWithRetry(modelKey, modelMessages);
                    if (result && result.status === 'success') {
                        if (modelDef?.isPremium) {
                            hasSuccessfulPremiumGeneration = true;
                        }
                    }
                } catch (err: any) {
                    // Try fallback
                    const fallback = getFallbackModel(modelKey);
                    if (fallback) {
                        console.log(`Model ${modelKey} failed. Trying fallback ${fallback}`);
                        try {
                            const fallbackResult = await generateWithRetry(fallback, modelMessages, 1);
                            // Annotate that this is a fallback
                            result = {
                                ...fallbackResult,
                                note: `Fallback from ${modelKey}`
                            };
                            if (result && result.status === 'success') {
                                // Fallbacks usually aren't premium (e.g. Llama), so we don't count them?
                                // Or do we? Current fallbacks are free models.
                                // So we safe to say no premium generation here.
                            }
                        } catch (fallbackErr) {
                            // Fallback also failed
                        }
                    }

                    if (!result) {
                        // Final failure state
                        result = {
                            id: modelKey,
                            name: modelDef?.name || modelKey,
                            status: 'failed',
                            error: 'Model busy or overloaded',
                            reason: err.message
                        };
                    }
                }

                // 4. Save Assistant Response if success
                if (result.status === 'success' && result.text && chatId) {
                    try {
                        await db.saveMessage(chatId, 'assistant', result.text, result.id);
                    } catch (dbErr) {
                        console.error("DB Error saving response:", dbErr);
                    }
                }

                return result;
            })
        );

        // -------------------------
        // INCREMENT TRIAL USAGE
        // -------------------------
        if (isUsingPremium && hasSuccessfulPremiumGeneration && dbUser) {
            const isPremium = dbUser.is_premium || false;
            // Only increment if user is NOT premium (and logic implies they were under limit to get here)
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
