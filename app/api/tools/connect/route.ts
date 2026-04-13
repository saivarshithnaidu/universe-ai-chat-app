import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { TOOLS } from '@/lib/tools';

/**
 * Connect/Disconnect External Tools
 * POST /api/tools/connect
 * Body: { toolKey, apiKey, action: 'connect' | 'disconnect' }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { toolKey, apiKey, action } = await req.json();

        if (!toolKey || !TOOLS[toolKey]) {
            return NextResponse.json({ error: "Invalid Tool Key" }, { status: 400 });
        }

        if (action === 'disconnect') {
            await db.deleteUserTool(userId, toolKey);
            return NextResponse.json({ success: true, message: `Disconnected ${toolKey}.` });
        }

        if (!apiKey) {
            return NextResponse.json({ error: "API Key required to connect." }, { status: 400 });
        }

        // Save encrypted API key
        await db.saveUserTool(userId, toolKey, apiKey);

        return NextResponse.json({ 
            success: true, 
            message: `Successfully connected ${TOOLS[toolKey].name}!` 
        });

    } catch (e: any) {
        console.error("Connect Tool Error:", e.message);
        return NextResponse.json({ error: "Failed to manage tool connection." }, { status: 500 });
    }
}

/**
 * List Connected Tools
 * GET /api/tools/connect
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connections = await db.listUserTools(userId);
        return NextResponse.json({ connections });

    } catch (e: any) {
        return NextResponse.json({ error: "Failed to fetch connections." }, { status: 500 });
    }
}
