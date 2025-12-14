import { AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

// actually, prompt said "No external UI libraries". It didn't forbid utility libraries. But to be safe and "minimal", I'll just use whitespace-pre-wrap div.

interface ModelResponseCardProps {
    model: AIModel;
    messages: { role: string; content: string }[];
    isLoading: boolean;
    error?: any;
}

export function ModelResponseCard({ model, messages, isLoading, error }: ModelResponseCardProps) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.role === 'assistant' ? lastMessage.content : '';

    return (
        <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 h-full shadow-sm">
            <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Bot className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">{model.name}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto min-h-[200px] text-sm leading-relaxed prose dark:prose-invert max-w-none">
                {error ? (
                    <div className="text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded text-xs font-mono break-all">
                        Error: {error.message || JSON.stringify(error)}
                    </div>
                ) : content ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                    <span className="text-zinc-400 italic">Waiting for response...</span>
                )}
            </div>
        </div>
    );
}
