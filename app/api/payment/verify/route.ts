import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PRICING: Record<string, number> = {
    'pro': 19900,
    'basic': 9900
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

        // 1. Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
        }

        // 2. Critical: Verify Amount Matches Plan (Trust but Verify)
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const expectedAmount = PRICING[plan] || 0;

        // Skip amount check in development if it was a test ₹1 payment
        const isTestPayment = process.env.NODE_ENV === 'development' && Number(payment.amount) === 100;

        if (Number(payment.amount) !== expectedAmount && !isTestPayment) {
            console.error(`Amount Mismatch: Paid ${payment.amount}, Expected ${expectedAmount}`);
            return NextResponse.json({ success: false, message: 'Payment amount mismatch' }, { status: 400 });
        }

        // 3. Update user in DB
        await db.upgradeToPremium(userId, plan || 'pro');

        return NextResponse.json({
            success: true,
            message: 'Payment verified and subscription activated'
        });

    } catch (error: any) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
