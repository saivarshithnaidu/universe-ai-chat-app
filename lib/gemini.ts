import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Valid Gemini Models ──────────────────────────────────────────────────────
const GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

// ─── Round-Robin Key Pool ─────────────────────────────────────────────────────
let keyIndex = 0;

export function getGeminiKeys(): string[] {
    const keys: string[] = [];
    const poolEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (poolEnv) {
        keys.push(...poolEnv.split(',').map(k => k.trim()).filter(Boolean));
    }
    // Additional keys for rotation
    for (let i = 1; i <= 5; i++) {
        const k = process.env[`GEMINI_API_KEY_${i}`];
        if (k) keys.push(k.trim());
    }
    return [...new Set(keys)];
}

function nextKey(keys: string[]): string {
    const key = keys[keyIndex % keys.length];
    return key;
}

function rotateKey(keys: string[]) {
    keyIndex = (keyIndex + 1) % keys.length;
}

// ─── Code Agent System Prompt ─────────────────────────────────────────────────
const CODE_AGENT_PROMPT = `You are an elite senior full-stack AI engineer.

YOUR MISSION:
Generate a complete, production-ready application based on the user's request.

ENTRY POINT (CRITICAL):
- Generate 'App.js' as the main entry point.
- It MUST import all components and render the final UI.

TECHNICAL REQUIREMENTS:
- React + Tailwind CSS + Lucide-React
- Sophisticated UI (glassmorphism, gradients, smooth transitions)
- Modular architecture — separate components
- Realistic mock data included

FILE STRUCTURE:
- App.js (mandatory)
- tailwind.config.js (mandatory)
- index.html (mandatory)
- styles.css (mandatory)
- components/ folder

STRICT RULES:
- Return ONLY valid JSON. No explanations. No truncation.

JSON FORMAT:
{
  "projectName": "App Title",
  "framework": "react",
  "files": [
    { "path": "App.js", "content": "..." },
    { "path": "tailwind.config.js", "content": "..." },
    { "path": "index.html", "content": "..." },
    { "path": "styles.css", "content": "..." }
  ]
}`;

// ─── Result Type ──────────────────────────────────────────────────────────────
export interface GeminiResult {
    id: string;
    text: string;
    status: 'success' | 'failed';
    type: 'llm';
    modelUsed: string;
    project?: {
        projectName?: string;
        framework?: string;
        files: Record<string, string>;
    };
}

// ─── Core Gemini Call (single model + key, with timeout) ─────────────────────
async function callGemini(
    modelId: string,
    apiKey: string,
    parts: { text: string }[],
    timeoutMs = 12000
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });

    const resultPromise = model.generateContent(parts);
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${modelId} >${timeoutMs / 1000}s`)), timeoutMs)
    );

    const result = await Promise.race([resultPromise, timeoutPromise]) as any;
    return result.response.text();
}

// ─── Agent Handler ────────────────────────────────────────────────────────────
/**
 * Uses a single model but allows key rotation ONLY on failure.
 */
export async function handleGeminiAgent(
    messages: any[],
    systemPrompt?: string
): Promise<GeminiResult> {
    const keys = getGeminiKeys();
    if (keys.length === 0) throw new Error("No Gemini keys configured.");

    const modelId = GEMINI_MODELS[0]; 
    
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.role === 'user' ? lastMessage.content : "";
    const prompt = systemPrompt || CODE_AGENT_PROMPT;
    const parts = [{ text: prompt }, { text: userPrompt }];

    // Max 2 retries with different keys
    for (let attempt = 0; attempt < Math.min(3, keys.length); attempt++) {
        const apiKey = nextKey(keys);
        try {
            const rawText = await callGemini(modelId, apiKey, parts, 15000);
            const project = extractProjectJson(rawText);

            return {
                id: 'gemini-agent',
                text: rawText,
                status: 'success',
                type: 'llm',
                modelUsed: modelId,
                project: project ?? undefined,
            };
        } catch (err: any) {
            console.warn(`[Gemini Agent] Attempt ${attempt + 1} failed: ${err.message}`);
            rotateKey(keys);
        }
    }

    return {
        id: 'gemini-agent',
        text: "⚠️ Gemini Agent is currently taking a breather. Please try again later.",
        status: 'failed',
        type: 'llm',
        modelUsed: modelId
    };
}

// ─── Plain Chat Handler ───────────────────────────────────────────────────────
export async function handleGeminiChat(
    messages: any[],
    systemPrompt = "You are a helpful AI assistant."
): Promise<string> {
    const keys = getGeminiKeys();
    const modelId = GEMINI_MODELS[0];
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.role === 'user' ? lastMessage.content : "";
    const parts = [{ text: systemPrompt }, { text: userPrompt }];

    for (let attempt = 0; attempt < Math.min(2, keys.length); attempt++) {
        const apiKey = nextKey(keys);
        try {
            return await callGemini(modelId, apiKey, parts, 10000);
        } catch {
            rotateKey(keys);
        }
    }
    throw new Error("Gemini chat unavailable.");
}

// ─── JSON Project Extractor ───────────────────────────────────────────────────
function extractProjectJson(text: string): {
    projectName?: string;
    framework?: string;
    files: Record<string, string>;
} | null {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;

        const parsed = JSON.parse(text.substring(start, end + 1));
        if (!parsed.files) return null;

        if (Array.isArray(parsed.files)) {
            const filesObj: Record<string, string> = {};
            for (const f of parsed.files) {
                if (f.path && f.content) filesObj[f.path] = f.content;
            }
            if (Object.keys(filesObj).length === 0) return null;
            return { projectName: parsed.projectName, framework: parsed.framework, files: filesObj };
        }

        if (typeof parsed.files === 'object' && Object.keys(parsed.files).length > 0) {
            return parsed;
        }

        return null;
    } catch {
        return null;
    }
}
