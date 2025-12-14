export interface AIModel {
    id: string;
    name: string;
    description: string;
    modelId: string; // The actual ID sent to OpenRouter
}

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'gemini-2-0-flash-exp',
        name: 'Gemini 2.0 Flash Exp',
        description: 'Google\'s experimental multimodal model (Free)',
        modelId: 'google/gemini-2.0-flash-exp:free',
    },
    {
        id: 'llama-3-3-70b',
        name: 'Llama 3.3 70B',
        description: 'Meta\'s latest open model (Free)',
        modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    {
        id: 'qwen-2-5-72b',
        name: 'Qwen 2.5 72B',
        description: 'High performance open model (Free)',
        modelId: 'qwen/qwen-2.5-72b-instruct:free',
    },
    {
        id: 'phi-3-medium',
        name: 'Phi-3 Medium',
        description: 'Microsoft\'s capable small model (Free)',
        modelId: 'microsoft/phi-3-medium-128k-instruct:free',
    },
];

export function getModelById(id: string): AIModel | undefined {
    return AVAILABLE_MODELS.find((model) => model.id === id);
}
