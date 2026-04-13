import { requireAdmin, logAdminAction } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);
        const adminId = (session?.user as any)?.id;
        const { id: targetUserId } = await params;
        const body = await req.json();

        const { plan, role, is_disabled } = body;

        // Update user based on provided fields
        if (plan !== undefined) {
            await adminDb.updateUserPlan(targetUserId, plan);
            await logAdminAction(adminId!, `update_plan_${plan}`, targetUserId);
        }

        if (role !== undefined) {
            await adminDb.updateUserRole(targetUserId, role);
            await logAdminAction(adminId!, `update_role_${role}`, targetUserId);
        }

        if (is_disabled !== undefined) {
            await adminDb.disableUser(targetUserId, is_disabled);
            await logAdminAction(adminId!, is_disabled ? 'disable_user' : 'enable_user', targetUserId);
        }

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Admin user update error:', error);
        return Response.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}
