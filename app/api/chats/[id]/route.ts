import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: chatId } = await params;

        // Verify chat ownership
        const chat = await db.getChat(chatId);
        if (!chat || chat.user_id !== userId) {
            return Response.json({ error: 'Unauthorized - Chat not found or access denied' }, { status: 403 });
        }

        // Now safe to fetch messages with user validation
        const messages = await db.getChatMessages(chatId, userId);

        return Response.json({ messages });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!process.env.DATABASE_URL) {
        return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await db.deleteChat(id, userId);

        return Response.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete chat:", error);
        return Response.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}
