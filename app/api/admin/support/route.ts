import { requireAdmin } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;

        const tickets = await adminDb.getSupportTickets({
            status,
            priority,
            limit: 50,
            offset: 0,
        });

        return Response.json(tickets);
    } catch (error: any) {
        console.error('Admin support API error:', error);
        return Response.json(
            { error: error.message || 'Unauthorized' },
            { status: 403 }
        );
    }
}
