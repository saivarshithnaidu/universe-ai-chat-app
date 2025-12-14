import { AVAILABLE_MODELS, AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ModelSelectorProps {
    selectedModelIds: string[];
    onToggle: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ selectedModelIds, onToggle, disabled }: ModelSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {AVAILABLE_MODELS.map((model) => {
                const isSelected = selectedModelIds.includes(model.id);
                return (
                    <button
                        key={model.id}
                        onClick={() => onToggle(model.id)}
                        disabled={disabled || (!isSelected && selectedModelIds.length >= 3)}
                        className={cn(
                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                            isSelected
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/20"
                                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900",
                            disabled && "opacity-50 cursor-not-allowed",
                            !isSelected && selectedModelIds.length >= 3 && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="flex w-full items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{model.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {model.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
