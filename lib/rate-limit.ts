import { db } from './db';

// Rate Limits
const FREE_LIMIT = 10;
const PRO_LIMIT = 50;
const WINDOW_SECONDS = 60; // 1 minute

export const rateLimiter = {
    async check(identifier: string, isPremium: boolean = false): Promise<{ success: boolean; remaining: number }> {
        const limit = isPremium ? PRO_LIMIT : FREE_LIMIT;

        // We use the db to track this. 
        // Key format: rate_limit:{identifier}
        const key = `rate_limit:${identifier}`;

        return await db.checkRateLimit(key, limit, WINDOW_SECONDS);
    },

    getLimits(isPremium: boolean) {
        return {
            limit: isPremium ? PRO_LIMIT : FREE_LIMIT,
            window: WINDOW_SECONDS
        };
    }
};
