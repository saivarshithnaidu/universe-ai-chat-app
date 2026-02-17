import { requireAdmin } from '@/lib/admin';
import { adminDb } from '@/lib/admin-db';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id: ticketId } = await params;
        const { status } = await req.json();

        await adminDb.updateTicketStatus(ticketId, status);

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Admin ticket update error:', error);
        return Response.json(
            { error: error.message || 'Failed to update ticket' },
            { status: 500 }
        );
    }
}
