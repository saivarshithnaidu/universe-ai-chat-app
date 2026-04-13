import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';

/**
 * PRODUCTION-READY: Connection Status for ResumeForgeAI
 * GET /api/plugins/resume/status
 * Identification via session
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const TOOL_KEY = 'resume_builder';
        const toolRes = await db.getUserTool(userId, TOOL_KEY);

        // Do NOT return the API key! 
        // Only return connection status and metadata
        if (toolRes) {
            return NextResponse.json({ 
                connected: true, 
                connectedAt: toolRes.connected_at,
                provider: "ResumeForgeAI",
                id: TOOL_KEY
            });
        }

        return NextResponse.json({ 
            connected: false,
            provider: "ResumeForgeAI"
        });

    } catch (e: any) {
        console.error("Resume Plugin Status Error:", e.message);
        return NextResponse.json({ error: "Database lookup failed." }, { status: 500 });
    }
}
