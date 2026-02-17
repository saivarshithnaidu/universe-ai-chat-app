import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { validateChatTitle } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: chatId } = await params;
        const { title } = await req.json();

        // Validate title
        const validation = validateChatTitle(title);
        if (!validation.valid) {
            return Response.json({ error: validation.error }, { status: 400 });
        }

        // Verify user owns this chat
        const chat = await db.getChat(chatId);
        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        if (chat.user_id !== userId) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update title
        await db.updateChatTitle(chatId, userId, title.trim());

        return Response.json({ success: true, title: title.trim() });
    } catch (error) {
        const errorResponse = handleApiError(error, 'CHAT_RENAME');
        return Response.json(errorResponse, { status: 500 });
    }
}
