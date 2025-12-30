const fetch = require('node-fetch'); // Assuming node-fetch is available or using native fetch in Node 18+

async function run() {
    console.log("Starting Rate Limit Test...");
    const url = 'http://localhost:3000/api/chat';
    const body = JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
        selectedModels: ['gemini-flash']
    });

    for (let i = 1; i <= 15; i++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            console.log(`Request ${i}: ${res.status}`);

            if (res.status === 429) {
                console.log("RATE LIMIT HIT! Success.");
                break;
            }
            if (res.status === 401) {
                console.log("Unauthorized. Need auth cookie? Skipping authentic logic for now, this confirms api reachable.");
                // We need auth. This script won't work easily without a session cookie.
                // Actually, checking rate limit WITHOUT auth will hit "Unauthorized" 401.
                // Rate limit checks happen AFTER auth in my code: 
                // `if (!userId) return 401;`
                // `rateLimiter.check(userId)`
                //
                // So I cannot verify rate limit easily via script without a valid Clerk session token.
                //
                // I will try to use the Browser Subagent logic instead, or just trust the implementation + unit test theory.
                // 
                // Wait, if I use browser subagent, I can't easily loop 15 times fast.
                // Use browser subagent to execute JS in the console!
                break;
            }

        } catch (e) {
            console.error(e);
        }
        await new Promise(r => setTimeout(r, 200));
    }
}

run();
