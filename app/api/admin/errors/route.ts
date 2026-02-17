import { requireAdmin } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || undefined;
        const severity = searchParams.get('severity') || undefined;

        const errors = await adminDb.getErrorLogs({
            type,
            severity,
            limit: 100,
            offset: 0,
        });

        return Response.json(errors);
    } catch (error: any) {
        console.error('Admin errors API error:', error);
        return Response.json(
            { error: error.message || 'Unauthorized' },
            { status: 403 }
        );
    }
}
