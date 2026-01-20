
import { cn } from '@/lib/utils';
import { ArrowUp, Paperclip, Sparkles } from 'lucide-react';
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
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group z-20">
            <div className={cn(
                "relative flex items-end w-full p-2 bg-[#212121] rounded-[26px] transition-all duration-200",
                "focus-within:bg-[#2F2F2F] shadow-lg"
            )}>
                <button
                    type="button"
                    disabled={disabled || isLoading}
                    className="p-2 ml-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded-full hover:bg-white/5"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="Message Universal AI..."
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 focus:ring-0 py-3 px-3 max-h-[200px] min-h-[48px] outline-none text-[16px] text-zinc-100 placeholder:text-zinc-500 font-normal leading-relaxed custom-scrollbar"
                    disabled={disabled || isLoading}
                />

                <button
                    type="submit"
                    disabled={!input.trim() || disabled || isLoading}
                    className={cn(
                        "p-2 rounded-full flex-shrink-0 transition-all duration-200 mb-1 mr-1 flex items-center justify-center",
                        !input.trim() || disabled || isLoading
                            ? "bg-transparent text-zinc-600 cursor-not-allowed"
                            : "bg-white text-zinc-900 hover:bg-zinc-200"
                    )}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin" />
                    ) : (
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    )}
                </button>
            </div>
        </form>
    );
}
