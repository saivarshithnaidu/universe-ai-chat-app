import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    // 1. Environment Safety
    if (!process.env.DATABASE_URL) {
        console.error("API Error: DATABASE_URL is missing");
        return Response.json(
            { error: "Database not configured" },
            { status: 500 }
        );
    }

    try {
        // 2. Auth Safety
        const { userId } = await auth();
        if (!userId) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 3. Database Query
        const chats = await db.getUserChats(userId);

        // 4. Response Format
        return Response.json(chats);

    } catch (error: any) {
        // 5. Error Handling
        console.error("Failed to fetch chats:", error);
        return Response.json(
            { error: "Failed to fetch chats" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    if (!process.env.DATABASE_URL) {
        return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        await db.deleteAllChats(userId);

        return Response.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete all chats:", error);
        return Response.json({ error: "Failed to delete chats" }, { status: 500 });
    }
}
