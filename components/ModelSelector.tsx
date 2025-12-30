'use client';

import { AVAILABLE_MODELS, AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Check, Bot, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModelSelectorProps {
    selectedModelIds: string[];
    onToggle: (modelId: string) => void;
    disabled?: boolean;
    isPremium?: boolean;
    trialUsage?: number;
    trialLimit?: number;
}

export function ModelSelector({
    selectedModelIds,
    onToggle,
    disabled,
    isPremium = false,
    trialUsage = 0,
    trialLimit = 5
}: ModelSelectorProps) {
    const router = useRouter();
    const freeModels = AVAILABLE_MODELS.filter(m => !m.isPremium);
    const premiumModels = AVAILABLE_MODELS.filter(m => m.isPremium);

    const renderModelCard = (model: AIModel) => {
        const isSelected = selectedModelIds.includes(model.id);
        const isPremium = model.isPremium;

        return (
            <button
                key={model.id}
                onClick={() => onToggle(model.id)}
                disabled={disabled || (!isSelected && selectedModelIds.length >= 3)}
                className={cn(
                    "flex flex-col items-start p-4 rounded-xl border transition-all text-left relative",
                    isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700",
                    isPremium && !isSelected && "hover:border-amber-300 dark:hover:border-amber-800",
                    !isPremium && disabled && "opacity-50 cursor-not-allowed",
                    !isPremium && !isSelected && selectedModelIds.length >= 3 && "opacity-50 cursor-not-allowed"
                )}
            >
                {isPremium && (
                    <div className="absolute top-2 right-2 text-amber-500">
                        <Lock className="w-4 h-4" />
                    </div>
                )}

                <div className="flex w-full items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {model.id === 'gemini-flash' || model.id === 'gemini-flash-3.0-pro' ? (
                            <img src="/icons/gemini.png" alt="Gemini" className="w-5 h-5 object-contain" />
                        ) : model.id === 'phi-3-medium' ? (
                            <img src="/icons/phi.png" alt="Phi" className="w-5 h-5 object-contain" />
                        ) : model.id === 'mixtral-8x7b' ? (
                            <img src="/icons/mixtral.svg" alt="Mixtral" className="w-5 h-5 object-contain" />
                        ) : model.id === 'llama-3.1-8b' ? (
                            <img src="/icons/llama.png" alt="LLaMA" className="w-5 h-5 object-contain" />
                        ) : model.id === 'claude-sonnet' ? (
                            <Bot className="w-5 h-5 text-purple-600" />
                        ) : model.id === 'gpt-5.2-pro' ? (
                            <Bot className="w-5 h-5 text-green-600" />
                        ) : (
                            <Bot className="w-5 h-5 text-zinc-500" />
                        )}
                        <span className="font-semibold text-sm">
                            {model.name}
                        </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {model.description}
                </p>
            </button >
        );
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                    Free Models
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {freeModels.map(renderModelCard)}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                        Pro Models
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                        COMING SOON...
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {premiumModels.map(renderModelCard)}
                </div>
            </div>
        </div>
    );
}
