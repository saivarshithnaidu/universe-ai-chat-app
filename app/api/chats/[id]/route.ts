import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params as per Next.js 15/16 requirements
        const { id: chatId } = await params;

        const chat = await db.getChat(chatId);
        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        if (chat.user_id !== userId) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await db.getChatMessages(chatId);
        return Response.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
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
