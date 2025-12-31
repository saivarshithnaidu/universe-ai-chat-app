'use client';

import { AVAILABLE_MODELS, AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Check, Bot, Lock, Sparkles } from 'lucide-react';
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
        const isLocked = !isPremium && model.isPremium;

        return (
            <button
                key={model.id}
                onClick={() => onToggle(model.id)}
                disabled={disabled || (!isSelected && selectedModelIds.length >= 3)}
                className={cn(
                    "flex flex-col items-start p-4 rounded-xl border transition-all text-left relative group backdrop-blur-sm",
                    isSelected
                        ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50"
                        : "border-white/5 bg-[#181818]/60 hover:bg-[#202020] hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg",
                    isLocked && !isSelected && "hover:border-amber-500/30",
                    !isLocked && disabled && "opacity-50 cursor-not-allowed",
                    !isLocked && !isSelected && selectedModelIds.length >= 3 && "opacity-40 cursor-not-allowed contrast-50"
                )}
            >
                {isLocked && (
                    <div className="absolute top-2 right-2 text-amber-500/80">
                        <Lock className="w-3.5 h-3.5" />
                    </div>
                )}

                <div className="flex w-full items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className={cn(
                            "p-1.5 rounded-lg flex items-center justify-center transition-colors",
                            isSelected ? "bg-blue-500/20" : "bg-white/5 group-hover:bg-white/10"
                        )}>
                            {model.id === 'gemini-flash' || model.id === 'gemini-flash-3.0-pro' ? (
                                <img src="/icons/gemini.png" alt="Gemini" className="w-4 h-4 object-contain" />
                            ) : model.id === 'phi-3-medium' ? (
                                <img src="/icons/phi.png" alt="Phi" className="w-4 h-4 object-contain" />
                            ) : model.id === 'mixtral-8x7b' ? (
                                <img src="/icons/mixtral.svg" alt="Mixtral" className="w-4 h-4 object-contain invert opacity-90" />
                            ) : model.id === 'llama-3.1-8b' ? (
                                <img src="/icons/llama.png" alt="LLaMA" className="w-4 h-4 object-contain" />
                            ) : model.id === 'claude-sonnet' ? (
                                <Bot className="w-4 h-4 text-purple-400" />
                            ) : model.id === 'gpt-5.2-pro' ? (
                                <Bot className="w-4 h-4 text-green-400" />
                            ) : (
                                <Bot className="w-4 h-4 text-zinc-400" />
                            )}
                        </div>
                        <span className={cn(
                            "font-semibold text-sm tracking-tight",
                            isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                        )}>
                            {model.name}
                        </span>
                    </div>
                    {isSelected && (
                        <div className="p-0.5 bg-blue-500 rounded-full">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                    )}
                </div>
                <p className="text-[13px] text-zinc-500 group-hover:text-zinc-400 line-clamp-2 leading-relaxed">
                    {model.description}
                </p>
            </button >
        );
    };

    return (
        <div className="w-full space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                        Available Models
                    </h3>
                    <div className="h-px bg-white/5 flex-1 ml-2"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {freeModels.map(renderModelCard)}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <h3 className="text-xs font-semibold text-amber-500/80 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Premium Models
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                        COMING SOON
                    </span>
                    <div className="h-px bg-amber-500/10 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {premiumModels.map(renderModelCard)}
                </div>
            </div>
        </div>
    );
}
