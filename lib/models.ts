export interface AIModel {
    id: string;
    name: string;
    description: string;
    modelId: string; // OpenRouter model ID
    provider: string;
    isPremium?: boolean;
}


export const SUPPORTED_MODELS = [
    "openai/gpt-4o-mini",
    "meta-llama/llama-3-8b-instruct",
    "mistralai/mistral-7b-instruct",
    "deepseek/deepseek-chat",
    "google/gemini-2.0-flash-001",
    "google/gemini-2.0-flash-lite-001",
    "anthropic/claude-3.5-sonnet",
    "deepseek/deepseek-r1",
];

export const ALL_MODELS: AIModel[] = [
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast, efficient OpenAI model (Free)',
        modelId: 'openai/gpt-4o-mini',
        provider: 'OpenAI',
    },
    {
        id: 'llama-3-8b',
        name: 'LLaMA 3 8B',
        description: 'Meta efficient open model (Free)',
        modelId: 'meta-llama/llama-3-8b-instruct',
        provider: 'Meta',
    },
    {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'DeepSeek-V3 versatile chat model (Free)',
        modelId: 'deepseek/deepseek-chat',
        provider: 'DeepSeek',
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Ultra-fast multimodal model (Free)',
        modelId: 'google/gemini-2.0-flash-001',
        provider: 'Google',
    },
    {
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite',
        description: 'Lightweight high-speed model (Free)',
        modelId: 'google/gemini-2.0-flash-lite-001',
        provider: 'Google',
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI flagship multimodal model',
        modelId: 'openai/gpt-4o',
        provider: 'OpenAI',
        isPremium: true,
    },
    {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic most intelligent model',
        modelId: 'anthropic/claude-3.5-sonnet',
        provider: 'Anthropic',
        isPremium: true,
    },
];

export const AVAILABLE_MODELS = ALL_MODELS.filter(model => {
    if (model.isPremium) {
        return process.env.NEXT_PUBLIC_ENABLE_PRO_MODELS === 'true';
    }
    return true;
});

export function getModelById(id: string): AIModel | undefined {
    return AVAILABLE_MODELS.find((model) => model.id === id);
}
