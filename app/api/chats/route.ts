import { db } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 3. Database Query
        const chats = await db.getChats(userId);

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
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await db.query(`DELETE FROM chats WHERE user_id = $1`, [userId]);

        return Response.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete all chats:", error);
        return Response.json({ error: "Failed to delete chats" }, { status: 500 });
    }
}
