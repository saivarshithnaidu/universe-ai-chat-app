import OpenAI from 'openai';
import { getModelById } from './models';

// ─── Key Pools ────────────────────────────────────────────────────────────────

function getFreeKey(): string | null {
    const rawKeys = process.env.OPENROUTER_FREE_KEYS || 
                   process.env.OPENROUTER_API_KEY || 
                   process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    
    const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        console.error("[OpenRouter] CRITICAL: No API keys found in environment variables.");
        return null;
    }
    return keys[Math.floor(Math.random() * keys.length)];
}

function getPaidKey(): string | null {
    return process.env.OPENROUTER_PAID_KEY || process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null;
}

// ─── OpenRouter Client Factory ────────────────────────────────────────────────

export function getOpenRouterClient(isPremiumModel = false): OpenAI {
    const apiKey = isPremiumModel ? getPaidKey() : getFreeKey();
    if (!apiKey) throw new Error("No OpenRouter API key available");

    return new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
        timeout: 60000, // 60s total fetch timeout
        defaultHeaders: {
            'HTTP-Referer': 'https://universalai.co.in',
            'X-Title': 'Universe AI',
        },
    });
}

// ─── Response Normalizer ──────────────────────────────────────────────────────

export function normalizeResponse(choice: any): string {
    if (!choice) return "";
    let content = choice.message?.content || choice.text || "";
    if (Array.isArray(content)) content = content.map((c: any) => c.text).join('\n');
    return typeof content === 'string' ? content.trim() : JSON.stringify(content);
}

// ─── Model Result Type ────────────────────────────────────────────────────────

export interface ModelResult {
    id: string;
    text: string;
    status: 'success' | 'failed';
    type: 'llm';
    modelId: string;
    error?: string;
}

// ─── Single Model Call (Best Mode) ────────────────────────────────────────────
/**
 * Calls exactly ONE model. No parallelism. No fallback.
 * Used in "best" mode — fires the preferred or first selected model only.
 */
export async function callSingleModel(
    modelKey: string,
    messages: any[],
    systemPrompt = "You are a helpful AI assistant.",
    timeoutMs = 40000
): Promise<ModelResult> {
    return callModel(modelKey, messages, systemPrompt, timeoutMs);
}

// ─── Single Model Call ────────────────────────────────────────────────────────
/**
 * Calls one model via OpenRouter.
 * Throws on failure — caller decides what to do.
 */
export async function callModel(
    modelKey: string,
    messages: any[],
    systemPrompt = "You are a helpful AI assistant.",
    timeoutMs = 40000
): Promise<ModelResult> {
    const modelDef = getModelById(modelKey);
    const modelId = modelDef ? modelDef.modelId : modelKey;
    const isPremium = modelDef ? !!modelDef.isPremium : false;

    const apiKey = isPremium ? getPaidKey() : getFreeKey();
    if (!apiKey) {
        console.error(`[OpenRouter] Missing API key for ${modelId}`);
        throw new Error("API Key logic failed: No key found in environment variables.");
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(-10),
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`;
                throw new Error(errMsg);
            }

            const data = await response.json();
            const text = normalizeResponse(data.choices?.[0]);

            if (!text) {
                // Check for OpenRouter-specific error structures
                if (data.error) throw new Error(data.error.message || "Unknown Provider Error");
                throw new Error("Received empty text from AI provider.");
            }

            return {
                id: modelDef?.id || modelKey,
                text,
                status: 'success',
                type: 'llm',
                modelId,
            };
        } catch (err: any) {
            lastError = err;
            console.warn(`[OpenRouter] ${modelId} attempt ${attempt} failed: ${err.message}`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
        }
    }

    throw lastError || new Error(`Failed to call ${modelId} after retries.`);
}

// ─── Parallel Multi-Model Execution ──────────────────────────────────────────
/**
 * Runs ALL selected models in parallel via Promise.allSettled.
 *
 * Returns:
 *  - `best`:    first fulfilled result (for default/single view)
 *  - `all`:     all results including failures (for "Compare Models" mode)
 */
export async function runModelsParallel(
    modelKeys: string[],
    messages: any[],
    systemPrompt?: string,
    timeoutMs = 40000
): Promise<{ best: ModelResult | null; all: ModelResult[] }> {
    if (modelKeys.length === 0) {
        return { best: null, all: [] };
    }

    const prompt = systemPrompt || "You are a helpful, direct AI assistant.";

    // Fire all simultaneously — allSettled never rejects the whole batch
    const settled = await Promise.allSettled(
        modelKeys.map(key => callModel(key, messages, prompt, timeoutMs))
    );

    const results: ModelResult[] = settled.map((res, i) => {
        const modelKey = modelKeys[i];
        if (res.status === 'fulfilled') {
            return res.value;
        } else {
            const modelDef = getModelById(modelKey);
            return {
                id: modelKey,
                text: "⚠️ Model failed to respond.",
                status: 'failed',
                type: 'llm',
                modelId: modelDef?.modelId || modelKey,
                error: (res as PromiseRejectedResult).reason?.message
            };
        }
    });

    const firstSuccess = results.find(r => r.status === 'success') || null;

    return {
        best: firstSuccess,
        all: results,
    };
}

/**
 * specialized call for Agent Mode (Code Builder)
 * returns a JSON-wrapped object for the UI to consume.
 */
export async function callOpenRouterAgent(
    messages: any[],
    agentPrompt: string
): Promise<any> {
    const client = getOpenRouterClient(true); // Agent usually needs premium
    try {
        const completion = await client.chat.completions.create({
            model: "google/gemini-2.0-pro-exp-02-05:free", // Defaulting agent to a strong model
            messages: [
                { role: 'system', content: agentPrompt },
                ...messages,
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Agents need precision
        });

        const text = normalizeResponse(completion.choices?.[0]);
        const data = JSON.parse(text);

        return {
            text: "Project structure generated successfully.",
            status: 'success',
            modelUsed: "gemini-2.0-pro (via OpenRouter)",
            project: data
        };
    } catch (err: any) {
        console.error("[OpenRouter Agent] Failed:", err.message);
        return {
            text: "⚠️ Agent failed to generate project. Try again.",
            status: 'failed',
            modelUsed: "OpenRouter",
            project: null
        };
    }
}
