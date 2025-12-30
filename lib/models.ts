export interface AIModel {
    id: string;
    name: string;
    description: string;
    modelId: string; // OpenRouter model ID
    provider: string;
    isPremium?: boolean;
}


export const ALL_MODELS: AIModel[] = [
    // Free Models
    {
        id: 'gemini-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast Google model (Free tier)',
        modelId: 'google/gemini-flash-1.5',
        provider: 'Google',
    },
    {
        id: 'llama-3.1-8b',
        name: 'LLaMA 3.1 8B',
        description: 'Meta open-source model (Free)',
        modelId: 'meta-llama/llama-3.1-8b-instruct',
        provider: 'Meta',
    },
    {
        id: 'mixtral-8x7b',
        name: 'Mixtral 8x7B',
        description: 'Strong reasoning open model (Free)',
        modelId: 'mistralai/mixtral-8x7b-instruct',
        provider: 'Mistral',
    },
    {
        id: 'phi-3-medium',
        name: 'Phi-3 Medium',
        description: 'Microsoft efficient model (Free)',
        modelId: 'microsoft/phi-3-medium-128k-instruct',
        provider: 'Microsoft',
    },
    // Premium Models
    {
        id: 'gpt-5.2-pro',
        name: 'GPT-4o',
        description: 'Most advanced OpenAI model',
        modelId: 'openai/gpt-4o',
        provider: 'OpenAI',
        isPremium: true,
    },
    {
        id: 'gpt-5-nano',
        name: 'GPT-5-nano',
        description: 'Fastest OpenAI model (Nano)',
        modelId: 'gpt-5-nano', // User requested ID
        provider: 'OpenAI',
        isPremium: true,
    },
    {
        id: 'claude-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'High intelligence & coding',
        modelId: 'anthropic/claude-3.5-sonnet',
        provider: 'Anthropic',
        isPremium: true,
    },
    {
        id: 'gemini-flash-3.0-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Google most capable model',
        modelId: 'google/gemini-pro-1.5',
        provider: 'Google',
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
