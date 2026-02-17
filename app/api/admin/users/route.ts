import { requireAdmin } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';
import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || undefined;
        const plan = searchParams.get('plan') || undefined;
        const role = searchParams.get('role') || undefined;

        const result = await adminDb.getAllUsers({
            page,
            search,
            plan,
            role,
            limit: 50,
        });

        return Response.json(result);
    } catch (error: any) {
        // Check for auth error
        if (error.message === 'Unauthorized: Admin access required') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const errorResponse = handleApiError(error, 'ADMIN_USERS');
        return Response.json(errorResponse, { status: 500 });
    }
}
