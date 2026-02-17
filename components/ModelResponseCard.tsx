import { useState } from 'react';
import { AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Bot, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';
import { stripMarkdown } from '@/lib/markdown-stripper';

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

    if (isLoading && !content && !error) {
        return (
            <div className="flex flex-col h-full bg-[#181818] rounded-2xl p-5 animate-pulse min-h-[120px]">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded bg-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-white/5" />
                    <div className="h-3 w-[90%] rounded bg-white/5" />
                    <div className="h-3 w-[60%] rounded bg-white/5" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300 relative group",
            status === 'failed' ? "bg-red-500/5 ring-1 ring-red-500/20" : "bg-transparent"
        )}>
            {/* Minimal Header */}
            <div className="flex items-center justify-between gap-2 px-1 mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1 rounded-md flex items-center justify-center",
                        "bg-transparent text-zinc-400"
                    )}>
                        {model.id === 'gemini-flash' || model.id === 'gemini-flash-3.0-pro' ? (
                            <img src="/icons/gemini.png" alt="Gemini" className="w-4 h-4 object-contain" />
                        ) : model.id === 'phi-3-medium' ? (
                            <img src="/icons/phi.png" alt="Phi" className="w-4 h-4 object-contain" />
                        ) : model.id === 'mixtral-8x7b' ? (
                            <img src="/icons/mixtral.svg" alt="Mixtral" className="w-4 h-4 object-contain invert opacity-80" />
                        ) : model.id === 'llama-3.1-8b' ? (
                            <img src="/icons/llama.png" alt="LLaMA" className="w-4 h-4 object-contain" />
                        ) : model.id === 'claude-sonnet' ? (
                            <Bot className="w-4 h-4 text-purple-400" />
                        ) : model.id === 'gpt-5.2-pro' ? (
                            <Bot className="w-4 h-4 text-green-400" />
                        ) : (
                            <Bot className="w-4 h-4" />
                        )}
                    </div>
                    <span className="font-semibold text-sm text-zinc-200">{model.name}</span>
                    {note && <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5 rounded-full bg-white/5">{note}</span>}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {content && !isLoading && status !== 'failed' && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            title="Copy response"
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />}
                </div>
            </div>

            {/* Content Area */}
            <div className="text-[15px] leading-[1.7] text-zinc-100 font-normal prose-invert max-w-none px-1 py-1 break-words overflow-wrap-anywhere">
                {error || status === 'failed' ? (
                    <div className="flex flex-col items-start gap-2 py-2">
                        <p className="text-sm text-red-400">{error || "Response failed."}</p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Try again
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="whitespace-pre-line">{stripMarkdown(content)}</div>
                )}
            </div>
        </div>
    );
}
