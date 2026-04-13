import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);

    try {
        switch (event.event) {
            case 'payment.captured':
            case 'order.paid':
                const userId = event.payload.payment.entity.notes.userId || event.payload.order.entity.notes.userId;
                const plan = event.payload.payment.entity.notes.plan || event.payload.order.entity.notes.plan || 'pro';
                if (userId) {
                    await db.upgradeToPremium(userId, plan);
                    console.log(`[Webhook] Success: Upgraded user ${userId} to ${plan}`);
                }
                break;
            case 'subscription.charged':
                // Handle renewal
                const subUserId = event.payload.subscription.entity.notes.userId;
                if (subUserId) {
                    await db.upgradeToPremium(subUserId, 'pro');
                }
                break;
            default:
                console.log(`[Webhook] Unhandled event: ${event.event}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('[Webhook Error]', err.message);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
