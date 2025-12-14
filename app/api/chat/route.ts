import { openrouter } from '@/lib/openrouter';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, model } = await req.json();
        console.log("API /chat called with model:", model);

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("OPENROUTER_API_KEY is missing");
            return new Response("OPENROUTER_API_KEY is missing", { status: 500 });
        }

        if (!model) {
            console.error("Missing model parameter");
            return new Response("Missing model parameter", { status: 400 });
        }

        const result = streamText({
            model: openrouter(model),
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Error in /api/chat:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
