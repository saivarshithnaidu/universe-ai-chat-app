import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let user = await db.getUser(userId);

        // If user doesn't exist yet (rare but possible), try syncing
        if (!user) {
            await db.upsertUser(userId);
            user = await db.getUser(userId);
        }

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({
            isPremium: user.is_premium || false,
            premiumTrialUsed: user.premium_trial_used || 0,
            trialLimit: 5
        });

    } catch (error: any) {
        console.error("User API Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
