import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        console.log("Health check started...");

        // 1. Check Environment Variables
        const hasDbUrl = !!process.env.DATABASE_URL;

        console.log("Env vars check:", { hasDbUrl });

        if (!hasDbUrl) {
            console.error("Health check warning: Missing DATABASE_URL");
            return NextResponse.json({
                status: 'error',
                message: 'Missing Environment Variables: DATABASE_URL is undefined. RESTART SERVER.',
                details: { hasDbUrl }
            }, { status: 500 });
        }

        // 2. Check Database Connection & Tables by running a simple query
        try {
            // Just query time or something simple to verify connection
            await db.query('SELECT NOW()');
        } catch (dbErr: any) {
            console.error("Health check failed: Database connection error", dbErr);
            return NextResponse.json({
                status: 'error',
                message: 'Database Connection Failed',
                error_message: dbErr.message || "Unknown error"
            });
        }

        console.log("Health check passed!");
        return NextResponse.json({
            status: 'ok',
            message: 'Fully Configured',
            isConfigured: true
        });

    } catch (err: any) {
        console.error("Health check fatal exception:", err);
        return NextResponse.json({
            status: 'error',
            message: 'Fatal Health Check Error',
            error: err?.message || String(err)
        }, { status: 500 });
    }
}
