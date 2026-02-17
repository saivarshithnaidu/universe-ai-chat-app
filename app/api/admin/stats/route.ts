import { requireAdmin } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
    try {
        await requireAdmin();

        const stats = {
            totalUsers: await adminDb.getTotalUsers(),
            activeUsers: await adminDb.getActiveUsers(30),
            freeUsers: await adminDb.getUsersByPlan('free'),
            proUsers: await adminDb.getUsersByPlan('pro'),
            totalMessages: await adminDb.getTotalMessages(),
            recentErrors: await adminDb.getErrorCount(24),
            openTickets: await adminDb.getOpenTicketsCount(),
        };

        return Response.json(stats);
    } catch (error: any) {
        if (error.message === 'Unauthorized: Admin access required') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const errorResponse = handleApiError(error, 'ADMIN_STATS');
        return Response.json(errorResponse, { status: 500 });
    }
}
