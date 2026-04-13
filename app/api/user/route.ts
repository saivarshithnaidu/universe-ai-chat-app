import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        
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
        const errorResponse = handleApiError(error, 'USER_API');
        return Response.json(errorResponse, { status: 500 });
    }
}
