import { openai, OPENAI_MODELS } from '@/lib/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, modelId } = body;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured', code: 'CONFIG_ERROR' },
                { status: 503 }
            );
        }

        // Resolve the actual OpenAI model ID
        const apiModelId = OPENAI_MODELS[modelId as keyof typeof OPENAI_MODELS] || 'gpt-4o';

        // Call OpenAI API (Server-side)
        const response = await openai.chat.completions.create({
            model: apiModelId,
            messages: messages.map((m: any) => ({
                role: m.role,
                content: m.content,
            })),
            max_tokens: 1024, // Safe limit as requested
            temperature: 0.7,
            store: true,
        });

        const completion = response.choices[0]?.message?.content || '';

        // Return clean JSON
        return NextResponse.json({
            id: modelId,
            text: completion,
            status: 'success',
            name: apiModelId
        });

    } catch (error: any) {
        console.error('OpenAI API Error:', error);

        // Handle specific OpenAI errors
        if (error.status === 401) {
            return NextResponse.json({ error: 'Invalid API Key', code: 'AUTH_ERROR' }, { status: 401 });
        }
        if (error.status === 429) {
            return NextResponse.json({ error: 'Rate limit exceeded or insufficient quota', code: 'RATE_LIMIT' }, { status: 429 });
        }

        return NextResponse.json(
            { error: error.message || 'Internal OpenAI Error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
