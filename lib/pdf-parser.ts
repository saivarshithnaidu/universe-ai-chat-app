/**
 * PRODUCTION-GRADE PDF ADAPTER (HuggingFace Hub)
 */

const PDF_API_URL = "https://saivarshithvc-pdf-service-api-univreseai.hf.space";

/**
 * Stage 1: HEALTH CHECK (Ensures service is awake)
 */
export async function checkServiceHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${PDF_API_URL}/health`, { 
            method: 'GET',
            signal: AbortSignal.timeout(3000) 
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Stage 1: RAW EXTRACTION (PyMuPDF - HF Hub)
 * Includes Smart Retry / Cold Start logic
 */
export async function extractTextFromPDF(buffer: Buffer, fileName: string): Promise<string> {
    const performParse = async () => {
        const formData = new FormData();
        // Convert Node.js Buffer to a Blob-compatible format
        const blob = new Blob([buffer as any], { type: 'application/pdf' });
        formData.append('file', blob, fileName);

        const response = await fetch(`${PDF_API_URL}/extract`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "HuggingFace extraction failed.");
        return result.data.text;
    };

    try {
        console.log(`[STAGE 1] Ingesting PDF via HF Hub: ${fileName}`);
        
        // 1. Quick Health Check
        const isOnline = await checkServiceHealth();
        
        if (!isOnline) {
            console.warn("[STAGE 1] PDF service is sleeping. Waking up... (Retrying in 5s)");
            await new Promise(r => setTimeout(r, 5000));
            return await performParse();
        }

        return await performParse();

    } catch (e: any) {
        console.error("[HF PARSER ERROR]", e.message);
        throw new Error(e.message.includes("Unexpected token") 
            ? "PDF service waking up... Please wait 10 seconds and try again."
            : `PDF Service Error: ${e.message}`);
    }
}

/**
 * Stage 2: SEMANTIC WORD CHUNKING (HF Hub)
 * @deprecated Use storeInRAG for production
 */
export async function getSemanticChunks(text: string): Promise<string[]> {
    try {
        console.log("[STAGE 2] Requesting semantic chunking from HF Hub...");

        const response = await fetch(`${PDF_API_URL}/chunk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "HuggingFace chunking failed.");
        
        return result.data.chunks;

    } catch (e: any) {
        console.warn("[HF CHUNKER ERROR] Falling back to standard local chunking...");
        return [];
    }
}

/**
 * Stage 3: PRODUCTION RAG STORAGE (ChromaDB + SentenceTransformers)
 */
export async function storeInRAG(text: string, userId: string, fileName: string): Promise<any> {
    try {
        // Task 5: Debug debug LOG
        console.log("[DEBUG] USER ID for STORE:", userId);
        console.log(`[RAG STORE] Ingesting text for ${userId} from ${fileName}`);
        
        const response = await fetch(`${PDF_API_URL}/rag/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                userId: userId, // Standardized to camelCase as requested
                metadata: { fileName, timestamp: new Date().toISOString() }
            }),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "RAG Storage failed.");
        return result.data;

    } catch (e: any) {
        console.error("[RAG STORE ERROR]", e.message);
        throw e;
    }
}

/**
 * Stage 4: PRODUCTION RAG SEARCH
 */
export async function queryRAG(question: string, userId: string): Promise<string> {
    try {
        // Task 5: Debug debug LOG
        console.log("[DEBUG] USER ID for QUERY:", userId);
        console.log(`[RAG QUERY] Searching context for ${userId}...`);

        const response = await fetch(`${PDF_API_URL}/rag/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                userId: userId, // Standardized to camelCase
                top_k: 3
            }),
        });

        const result = await response.json();
        
        // Task 5: Add debug logs for results
        console.log("[DEBUG] QUERY RESULTS:", result);

        if (!result.success) throw new Error(result.error || "RAG Query failed.");
        
        return result.data.context;

    } catch (e: any) {
        console.error("[RAG QUERY ERROR]", e.message);
        return "I couldn't retrieve information from your documents at this time.";
    }
}
