import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';

/**
 * PRODUCTION-READY: Secure API Key Storage for ResumeForgeAI
 * POST /api/plugins/resume/connect
 * Body: { apiKey }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized. Please log in to connect plugins." }, { status: 401 });
        }

        const { apiKey } = await req.json();

        if (!apiKey || apiKey.trim().length < 10) {
            return NextResponse.json({ error: "Invalid API Key format." }, { status: 400 });
        }

        // TOOL_KEY for ResumeForgeAI is 'resume_builder'
        const TOOL_KEY = 'resume_builder';

        // Securely encrypt and save via standard DB adapter (upsertUserTool)
        await db.upsertUserTool(userId, TOOL_KEY, apiKey.trim());

        console.log(`[PLUGIN CONNECT] Securely stored API Key for ResumeForgeAI (User: ${userId})`);

        return NextResponse.json({ 
            success: true, 
            message: "ResumeForgeAI plugin connected successfully!",
            timestamp: new Date().toISOString()
        });

    } catch (e: any) {
        console.error("Resume Plugin Connection Error:", e.message);
        return NextResponse.json({ error: "Failed to connect plugin. Database error." }, { status: 500 });
    }
}
