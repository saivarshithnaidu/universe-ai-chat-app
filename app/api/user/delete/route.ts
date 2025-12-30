import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete from DB (Cascade will handle chats/messages if configured, but we do explicit user delete)
        await db.deleteUser(userId);

        // Note: We cannot delete from Clerk via this API without Secret Key and advanced permissions.
        // For this task, we wipe our DB. User can delete clerk account via Clerk User Profile component if enabled.

        return NextResponse.json({ success: true, message: "User data deleted" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
    }
}
