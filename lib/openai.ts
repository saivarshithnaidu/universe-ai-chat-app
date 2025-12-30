import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn('Missing OPENAI_API_KEY environment variable.');
}

// Singleton instance for server-side usage
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODELS = {
    'gpt-5.2-pro': 'gpt-4o', // Mapping our internal ID to real ID
    'gpt-4o': 'gpt-4o',
    'gpt-5-nano': 'gpt-5-nano', // Pass through as requested by user
    'gpt-4o-mini': 'gpt-4o-mini',
};
