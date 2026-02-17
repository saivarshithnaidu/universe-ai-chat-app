import { db } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Get chat by share token
        const chat = await db.getChatByShareToken(token);
        if (!chat) {
            return Response.json({ error: 'Chat not found or not public' }, { status: 404 });
        }

        // For public shares, pass the chat owner's userId to getChatMessages
        const messages = await db.getChatMessages(chat.id, chat.user_id);

        return Response.json({
            chat: {
                title: chat.title,
                created_at: chat.created_at
            },
            messages
        });
    } catch (error) {
        console.error('Error fetching shared chat:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
