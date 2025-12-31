import { useState } from 'react';
import { AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Bot, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';

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
            "flex flex-col border rounded-xl overflow-hidden h-full transition-all duration-300",
            status === 'failed' ? "border-red-500/30 bg-red-500/5" :
                isLoading ? "border-blue-500/30 bg-[#151515]" :
                    "border-white/5 bg-[#121212] hover:border-white/10 hover:shadow-lg"
        )}>
            {/* Header */}
            <div className="bg-black/20 px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "p-1 rounded-md flex items-center justify-center",
                        status === 'failed' ? "bg-red-500/10 text-red-500" :
                            "bg-white/5 text-zinc-400"
                    )}>
                        {model.id === 'gemini-flash' || model.id === 'gemini-flash-3.0-pro' ? (
                            <img src="/icons/gemini.png" alt="Gemini" className="w-3.5 h-3.5 object-contain" />
                        ) : model.id === 'phi-3-medium' ? (
                            <img src="/icons/phi.png" alt="Phi" className="w-3.5 h-3.5 object-contain" />
                        ) : model.id === 'mixtral-8x7b' ? (
                            <img src="/icons/mixtral.svg" alt="Mixtral" className="w-3.5 h-3.5 object-contain invert opacity-80" />
                        ) : model.id === 'llama-3.1-8b' ? (
                            <img src="/icons/llama.png" alt="LLaMA" className="w-3.5 h-3.5 object-contain" />
                        ) : model.id === 'claude-sonnet' ? (
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                        ) : model.id === 'gpt-5.2-pro' ? (
                            <Bot className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                            <Bot className="w-3.5 h-3.5" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-xs text-zinc-200 tracking-wide">{model.name}</span>
                        {note && <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">{note}</span>}
                    </div>
                </div>

                {/* Status Indicator & Controls */}
                <div className="flex items-center gap-2">
                    {content && !isLoading && status !== 'failed' && (
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 px-2 py-1 rounded-md transition-all"
                            title="Copy response"
                        >
                            {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                            {isCopied ? "Copied" : "Copy"}
                        </button>
                    )}
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                    {!isLoading && status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 overflow-y-auto min-h-[220px] text-[14px] leading-[1.6] text-zinc-300 font-normal tracking-wide prose-invert max-w-none relative scrollbar-thin scrollbar-thumb-zinc-800">
                {error || status === 'failed' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                        <div className="p-3 bg-red-500/10 rounded-full text-red-400 ring-1 ring-red-500/20">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-red-400 text-sm">
                                Response Failed
                            </p>
                            <p className="text-xs text-zinc-500 max-w-[180px] mx-auto leading-relaxed">
                                {error || "The model encountered an error. Please try again."}
                            </p>
                        </div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/5 hover:border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition-colors shadow-sm"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>
                        )}
                    </div>
                ) : content ? (
                    <div className="whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-500">{content}</div>
                ) : (
                    <div className="space-y-4 pt-2 w-full max-w-[90%] mx-auto opacity-40">
                        {/* Skeleton Loading */}
                        <div className="h-2 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded w-full animate-pulse" />
                        <div className="h-2 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded w-[90%] animate-pulse delay-75" />
                        <div className="h-2 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded w-[95%] animate-pulse delay-150" />
                        <div className="h-2 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded w-[80%] animate-pulse delay-200" />
                    </div>
                )}
            </div>
        </div>
    );
}
