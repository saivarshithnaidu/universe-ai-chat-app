
import { cn } from '@/lib/utils';
import { SendHorizontal } from 'lucide-react';
import { KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    disabled?: boolean;
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-end w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="Send a message..."
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 focus:ring-0 p-3 max-h-[200px] min-h-[52px] outline-none text-sm"
                    disabled={disabled || isLoading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || disabled || isLoading}
                    className={cn(
                        "p-2 rounded-xl flex-shrink-0 transition-all mb-1 mr-1",
                        !input.trim() || disabled || isLoading
                            ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    )}
                >
                    <SendHorizontal className="w-5 h-5" />
                </button>
            </div>
            <p className="text-xs text-zinc-400 text-center mt-2">
                Pick up to 3 models • <kbd className="font-sans px-1 rounded bg-zinc-100 dark:bg-zinc-800">Enter</kbd> to send
            </p>
        </form>
    );
}
