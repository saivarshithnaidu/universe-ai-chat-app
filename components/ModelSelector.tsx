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
}: ModelSelectorProps) {
    return (
        <div className="w-full overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-2 min-w-max px-2">
                {AVAILABLE_MODELS.map((model) => {
                    const isSelected = selectedModelIds.includes(model.id);
                    const isLocked = !isPremium && model.isPremium;

                    return (
                        <button
                            key={model.id}
                            onClick={() => !isLocked && onToggle(model.id)}
                            disabled={disabled || (isLocked && !isPremium)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                                isSelected 
                                    ? "bg-white text-black border-white shadow-lg shadow-white/10" 
                                    : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/10 hover:text-zinc-200",
                                isLocked && "opacity-50 grayscale cursor-not-allowed"
                            )}
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                model.provider === 'Google' ? "bg-blue-400" :
                                model.provider === 'OpenAI' ? "bg-green-400" :
                                model.provider === 'Anthropic' ? "bg-purple-400" : "bg-zinc-500"
                            )} />
                            {model.name}
                            {isLocked && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
