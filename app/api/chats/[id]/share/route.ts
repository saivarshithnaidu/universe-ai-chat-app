import { db } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: chatId } = await params;

        // Verify user owns this chat
        const chat = await db.getChat(chatId);
        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        if (chat.user_id !== userId) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Generate share token
        const token = await db.generateShareToken(chatId, userId);

        // Return share URL
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`;

        return Response.json({
            success: true,
            shareUrl,
            token
        });
    } catch (error) {
        console.error('Error creating share link:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
