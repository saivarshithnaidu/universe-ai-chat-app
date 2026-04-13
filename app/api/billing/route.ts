import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const details = await db.getBillingDetails(userId);
        return NextResponse.json(details || {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await req.json();

        // Server-side validation
        const required = ['name', 'phone', 'address_line1', 'area', 'city', 'state', 'pincode', 'country'];
        for (const field of required) {
            if (!data[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
        }

        if (!/^\d{10}$/.test(data.phone)) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        if (!/^\d{6}$/.test(data.pincode)) {
            return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
        }

        await db.saveBillingDetails(userId, data);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Billing Save Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
