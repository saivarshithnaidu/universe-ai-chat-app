import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Production-ready Pricing Config (in Paise)
const PRICING: Record<string, number> = {
    'pro': 19900,   // ₹199
    'basic': 9900,  // ₹99 (placeholder if needed)
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { plan, billing } = body;

        // 1. Validate Plan
        if (!plan || !PRICING[plan]) {
            console.error(`Invalid plan requested: ${plan}`);
            return NextResponse.json({ error: 'Invalid or missing plan' }, { status: 400 });
        }

        // 2. Determine Amount (Backend Controlled)
        let amountInPaise = PRICING[plan];

        // 3. Allow test amount in development ONLY if explicitly requested and enabled
        if (process.env.NODE_ENV === 'development' && body.amount === 1) {
            console.log("Development mode: Allowing test amount of ₹1");
            amountInPaise = 100; // ₹1 for testing
        }

        console.log(`Creating Razorpay order: Plan=${plan}, Amount=${amountInPaise / 100} INR, User=${userId}`);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: {
                userId,
                plan,
                ...billing
            }
        });

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Razorpay Order Error:', error);

        // Check for authentication failure
        if (error.statusCode === 401) {
            return NextResponse.json({
                error: 'Razorpay authentication failed. Check your API keys in .env'
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
}
