import { useState } from 'react';
import { AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Bot, User, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';

interface ModelResponseCardProps {
    model: AIModel;
    messages: { role: string; content: string }[];
    isLoading: boolean;
    error?: string;
    status?: 'success' | 'failed' | 'busy';
    note?: string;
    onRetry?: () => void;
}

export function ModelResponseCard({ model, messages, isLoading, error, status, note, onRetry }: ModelResponseCardProps) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.role === 'assistant' ? lastMessage.content : '';
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={cn(
            "flex flex-col border rounded-xl overflow-hidden h-full shadow-sm transition-all",
            status === 'failed' ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10" :
                isLoading ? "border-blue-200 dark:border-blue-900/50 bg-white dark:bg-zinc-900" :
                    "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        )}>
            {/* Header */}
            <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1 rounded",
                        status === 'failed' ? "bg-red-100 text-red-600" :
                            "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    )}>
                        {model.id === 'gemini-flash' || model.id === 'gemini-flash-3.0-pro' ? (
                            <img src="/icons/gemini.png" alt="Gemini" className="w-4 h-4 object-contain" />
                        ) : model.id === 'phi-3-medium' ? (
                            <img src="/icons/phi.png" alt="Phi" className="w-4 h-4 object-contain" />
                        ) : model.id === 'mixtral-8x7b' ? (
                            <img src="/icons/mixtral.svg" alt="Mixtral" className="w-4 h-4 object-contain" />
                        ) : model.id === 'llama-3.1-8b' ? (
                            <img src="/icons/llama.png" alt="LLaMA" className="w-4 h-4 object-contain" />
                        ) : model.id === 'claude-sonnet' ? (
                            <Bot className="w-4 h-4 text-purple-600" />
                        ) : model.id === 'gpt-5.2-pro' ? (
                            <Bot className="w-4 h-4 text-green-600" />
                        ) : (
                            <Bot className="w-4 h-4" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none">{model.name}</span>
                        {note && <span className="text-[10px] text-zinc-400 mt-0.5">{note}</span>}
                    </div>
                </div>

                {/* Status Indicator & Controls */}
                <div className="flex items-center gap-2">
                    {content && !isLoading && status !== 'failed' && (
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded transition-colors"
                            title="Copy response"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    )}
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                    {!isLoading && status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 overflow-y-auto min-h-[200px] text-sm leading-relaxed prose dark:prose-invert max-w-none relative">
                {error || status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-red-600 dark:text-red-400">
                                Model busy or unavailable
                            </p>
                            <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">
                                {error || "The model is currently overloaded. Please try again."}
                            </p>
                        </div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry Model
                            </button>
                        )}
                    </div>
                ) : content ? (
                    <div className="whitespace-pre-wrap animate-in fade-in duration-500">{content}</div>
                ) : (
                    <div className="space-y-3 opacity-50">
                        {/* Skeleton Loading */}
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
}
