/**
 * Vercel-Optimized Local Embedding Engine
 * Uses Transformers.js (CPU local) to generate vectors.
 * Model: Xenova/all-MiniLM-L6-v2 (Quantized: 23MB)
 * Optimized for Vercel Serverless (Low Memory & Fast Cold Start)
 */

import { pipeline, env } from '@xenova/transformers';

// Optimization for Serverless: Disable local caching to avoid read-only FS errors
env.allowLocalModels = false;
env.useBrowserCache = false;

let extractor: any = null;

async function getExtractor() {
    if (!extractor) {
        console.log("[EMBEDDINGS] Initializing LIGHTWEIGHT Transformer for Vercel...");
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true, // Crucial for Vercel (Faster & Smaller)
        });
    }
    return extractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return [];

    try {
        const generate = await getExtractor();
        const result = await generate(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    } catch (e: any) {
        console.error("[LOCAL EMBEDDINGS ERROR]", e.message);
        throw new Error("Local embedding generation failed.");
    }
}

export async function generateBatchEmbeddings(inputs: string[]): Promise<number[][]> {
    if (!inputs || inputs.length === 0) return [];

    try {
        const generate = await getExtractor();
        const embeddings: number[][] = [];

        for (const input of inputs) {
            const result = await generate(input, { pooling: 'mean', normalize: true });
            embeddings.push(Array.from(result.data));
        }

        return embeddings;
    } catch (e: any) {
        console.error("[LOCAL BATCH EMBEDDINGS ERROR]", e.message);
        throw new Error("Local batch embedding generation failed.");
    }
}
