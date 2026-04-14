import { db } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!process.env.DATABASE_URL) {
        console.warn("API Note: DATABASE_URL is missing, using hardcoded fallback in lib/db.ts");
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
        console.warn("API Note: DATABASE_URL is missing, using hardcoded fallback in lib/db.ts");
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
