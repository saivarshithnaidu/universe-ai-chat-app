import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { storeInRAG, extractTextFromPDF, checkServiceHealth } from '@/lib/pdf-parser';

export const maxDuration = 300; 

/**
 * PRODUCTION-GRADE RAG ORCHESTRATOR (HuggingFace Hub Version)
 * 1. PDF Parsing (HF Space)
 * 2. Word-based Semantic Chunking (HF Space)
 * 3. Local Vector Embeddings (MiniLM-v2)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const chatId = formData.get('chatId') as string || null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        // --- STAGE 0: Service Health Check ---
        const isAwake = await checkServiceHealth();
        if (!isAwake) {
            console.warn("[UPLOAD API] PDF service is waking up...");
        }

        // --- STAGE 1: PDF Extraction (External HF Hub) ---
        let rawText = "";

        if (file.type === 'application/pdf') {
            const buffer = Buffer.from(await file.arrayBuffer());
            rawText = await extractTextFromPDF(buffer, file.name);
        } else if (file.type.startsWith('text/')) {
            rawText = Buffer.from(await file.arrayBuffer()).toString('utf-8');
        } else {
            return NextResponse.json({ error: "Unsupported file type (Please use PDF or TXT)." }, { status: 400 });
        }

        // --- STAGE 2: Production RAG Storage (FastAPI + ChromaDB) ---
        const ragResult = await storeInRAG(rawText, userId, file.name);

        // --- STAGE 3: Sync Raw Text to User Profile (for Resume Tool) ---
        await db.updateUserResume(userId, rawText);

        return NextResponse.json({ 
            success: true, 
            message: `Document ingested: ${ragResult.chunks} high-fidelity segments stored in ChromaDB.`,
            fileName: file.name
        });

    } catch (e: any) {
        console.error("[UPLOAD API CRITICAL FAIL]", e.message);
        
        const isWakeUp = e.message.toLowerCase().includes("waking up");
        return NextResponse.json({ 
            error: isWakeUp 
                ? "PDF service is waking up... Please wait 10 seconds and try again." 
                : `Ingestion Error: ${e.message || "Please try a smaller file."}` 
        }, { status: isWakeUp ? 503 : 500 });
    }
}
