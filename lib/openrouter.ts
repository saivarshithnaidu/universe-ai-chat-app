import OpenAI from 'openai';
import { getModelById } from './models';

// ─── Key Pools ────────────────────────────────────────────────────────────────

function getFreeKey(): string | null {
    const keys = (process.env.OPENROUTER_FREE_KEYS || process.env.OPENROUTER_API_KEY || '')
        .split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
}

function getPaidKey(): string | null {
    return process.env.OPENROUTER_PAID_KEY || process.env.OPENROUTER_API_KEY || null;
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

    const client = getOpenRouterClient(isPremium);
    let lastError: any = null;

    // Internal retry (max 2 attempts) for transient errors only
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const callPromise = client.chat.completions.create({
                model: modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.slice(-10),
                ],
                max_tokens: 2048,
                temperature: 0.7,
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout: ${modelId} > ${timeoutMs / 1000}s`)), timeoutMs)
            );

            const completion = await Promise.race([callPromise, timeoutPromise]) as any;
            const text = normalizeResponse(completion.choices?.[0]);

            if (!text) throw new Error(`Empty response from ${modelId}`);

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
            if (attempt < 2) await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        }
    }

    throw lastError || new Error(`Failed to call ${modelId}`);
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
