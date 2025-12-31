
import { cn } from '@/lib/utils';
import { SendHorizontal, Sparkles } from 'lucide-react';
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
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full group">
            <div className={cn(
                "relative flex items-end w-full p-2 bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300",
                "focus-within:ring-1 focus-within:ring-white/20 focus-within:border-white/20 focus-within:bg-[#151515]",
                "hover:border-white/15 shadow-2xl"
            )}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="Compare thoughts..."
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 focus:ring-0 p-3 max-h-[200px] min-h-[52px] outline-none text-[15px] text-zinc-200 placeholder:text-zinc-600 font-light"
                    disabled={disabled || isLoading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || disabled || isLoading}
                    className={cn(
                        "p-2.5 rounded-xl flex-shrink-0 transition-all duration-300 mb-1 mr-1 flex items-center justify-center",
                        !input.trim() || disabled || isLoading
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            : "bg-white text-zinc-900 hover:bg-zinc-200 hover:scale-[1.05] active:scale-[0.95] shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)]"
                    )}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                    ) : (
                        <SendHorizontal className="w-5 h-5 fill-current" />
                    )}
                </button>
            </div>
        </form>
    );
}
