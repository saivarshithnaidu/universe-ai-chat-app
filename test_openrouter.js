const OpenAI = require('openai');
const fs = require('fs');

async function test() {
    console.log("--- OpenRouter Connectivity Test ---");
    let apiKey;
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        apiKey = env.match(/OPENROUTER_API_KEY=([^\n\r]+)/)[1];
    } catch (e) {
        console.error("Could not find API key in .env.local");
        return;
    }

    const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
    });

    try {
        console.log("Attempting a small completion...");
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 5
        });
        console.log("SUCCESS! Response:", completion.choices[0].message.content);
    } catch (err) {
        console.error("FAILED! Error details:");
        console.error("- Status:", err.status);
        console.error("- Message:", err.message);
        if (err.response) {
            console.error("- Body:", await err.response.text());
        }
    }
}

test();
