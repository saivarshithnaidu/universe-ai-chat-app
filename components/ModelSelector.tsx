'use client';

import { AVAILABLE_MODELS, AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Check, Bot, Lock, Sparkles, ChevronDown, Cpu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const freeModels = AVAILABLE_MODELS.filter(m => !m.isPremium);
    const premiumModels = AVAILABLE_MODELS.filter(m => m.isPremium);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderModelItem = (model: AIModel) => {
        const isSelected = selectedModelIds.includes(model.id);
        const isLocked = !isPremium && model.isPremium;

        return (
            <button
                key={model.id}
                onClick={() => {
                    if (!disabled && (!isLocked || isSelected || selectedModelIds.length < 3)) {
                        onToggle(model.id);
                    }
                }}
                disabled={disabled || (!isSelected && selectedModelIds.length >= 3 && !isLocked)}
                className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-left group",
                    isSelected ? "bg-white/10" : "hover:bg-white/5",
                    isLocked && "opacity-75"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-1.5 rounded-md flex items-center justify-center transition-colors",
                        isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-400"
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
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-zinc-300")}>
                                {model.name}
                            </span>
                            {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{model.description}</p>
                    </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-blue-400" />}
            </button>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                    {selectedModelIds.length === 0
                        ? "Select Models"
                        : `${selectedModelIds.length} Model${selectedModelIds.length > 1 ? 's' : ''} Selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-[#121212] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1.5 space-y-1">

                        {/* Selected Summary */}
                        <div className="px-2 py-1.5 mb-1">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                                Max 3 models
                            </p>
                        </div>

                        {/* Free Models Group */}
                        <div className="space-y-1">
                            <div className="px-2 py-1 bg-white/5 rounded mx-1">
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Free</span>
                            </div>
                            {freeModels.map(renderModelItem)}
                        </div>

                        {/* Premium Models Group */}
                        <div className="space-y-1 mt-3">
                            <div className="px-2 py-1 bg-amber-500/10 rounded mx-1 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Premium</span>
                                </div>
                                {!isPremium && (
                                    <span className="text-[9px] bg-amber-500 text-black font-bold px-1.5 rounded-sm">PRO</span>
                                )}
                            </div>
                            {premiumModels.map(renderModelItem)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
