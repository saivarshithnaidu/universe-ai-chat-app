import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { adminDb } from '@/lib/admin-db';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const { userId } = await auth();
        if (!userId) return false;

        const user = await adminDb.getUserById(userId);
        return user?.role === 'admin' && !user?.is_disabled;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Require admin access - throws error if not admin
 * Use in API routes to protect admin endpoints
 */
export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error('Unauthorized: Admin access required');
    }
}

/**
 * Get the current admin user object
 * Returns null if not admin
 */
export async function getAdminUser() {
    try {
        const { userId } = await auth();
        if (!userId) return null;

        const user = await adminDb.getUserById(userId);
        if (!user || user.role !== 'admin' || user.is_disabled) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error getting admin user:', error);
        return null;
    }
}

/**
 * Get the current user with full details
 * Syncs Clerk data with database
 */
export async function getCurrentUserWithSync() {
    try {
        const { userId } = await auth();
        if (!userId) return null;

        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        // Sync user data from Clerk to database
        await db.upsertUser(userId, clerkUser.emailAddresses[0]?.emailAddress);
        await adminDb.updateUserFromClerk(userId, {
            email: clerkUser.emailAddresses[0]?.emailAddress,
            name: clerkUser.fullName || clerkUser.firstName || 'User',
        });

        return await adminDb.getUserById(userId);
    } catch (error) {
        console.error('Error syncing user:', error);
        return null;
    }
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
    adminId: string,
    action: string,
    targetUserId?: string,
    details?: Record<string, any>
) {
    try {
        await adminDb.logAdminAction({
            admin_id: adminId,
            action,
            target_user_id: targetUserId,
            details,
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

/**
 * Check if user has specific permission
 * Extensible for future granular permissions
 */
export async function hasPermission(permission: string): Promise<boolean> {
    const admin = await isAdmin();
    // For now, all admins have all permissions
    // In future, can add permission-based checks
    return admin;
}
