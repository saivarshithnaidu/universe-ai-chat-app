// Minimal extension to db.ts to add query method for adminDb
import { Pool } from 'pg';

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

let dbPool: Pool;
if (process.env.NODE_ENV === 'production') {
    dbPool = pool;
} else {
    if (!(global as any).dbPool) {
        (global as any).dbPool = pool;
    }
    dbPool = (global as any).dbPool;
}

// Export pool for admin-db to use directly
export const adminPool = {
    query: (text: string, params?: any[]) => dbPool.query(text, params)
};
