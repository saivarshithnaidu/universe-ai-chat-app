import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
        }

        const files = await db.getChatProjectFiles(chatId);
        return NextResponse.json(files);

    } catch (error: any) {
        console.error('Project Files API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
