'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, Paperclip, Loader2, Bot, Zap } from 'lucide-react';
import { KeyboardEvent, useRef, useEffect, useCallback } from 'react';
import { ConnectorsToggleMenu } from './ConnectorsToggleMenu';

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((reset?: boolean) => {
    const el = textareaRef.current;
    if (!el) return;
    if (reset) { el.style.height = `${minHeight}px`; return; }
    el.style.height = `${minHeight}px`;
    el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight ?? Infinity))}px`;
  }, [minHeight, maxHeight]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  enabledConnectorIds?: string[];
  onToggleConnector?: (id: string) => void;
  onSendMessage: () => void;
  onOpenConnectors?: () => void;
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  disabled,
  placeholder = 'Ask anything — ChatGPT, Claude, Gemini…',
  enabledConnectorIds = [],
  onToggleConnector = () => {},
  onSendMessage,
  onOpenConnectors = () => {},
}: ChatInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled && !isLoading) {
        onSendMessage();
        adjustHeight(true);
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = input.trim() && !disabled && !isLoading;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) { onSendMessage(); adjustHeight(true); } }} className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={(e) => {
          // Future implementation: handle file upload/attachment here
          console.log('Files selected:', e.target.files);
        }}
      />
      <div className="relative w-full bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 focus-within:border-zinc-600 transition-colors shadow-2xl shadow-black/40">
        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent rounded-t-2xl pointer-events-none" />

        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "w-full px-5 py-4",
            "resize-none bg-transparent border-none",
            "text-white text-sm font-normal",
            "focus:outline-none focus:ring-0",
            "placeholder:text-zinc-600 placeholder:text-sm",
            "min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
          )}
          style={{ overflow: "hidden" }}
        />

        {/* Action row */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left: connectors, attach, models */}
          <div className="flex items-center gap-1.5">
            <ConnectorsToggleMenu
              enabledConnectorIds={enabledConnectorIds}
              onToggle={onToggleConnector}
              onOpenSettings={onOpenConnectors}
            />

            <button
              type="button"
              onClick={handleAttachClick}
              className="group flex items-center gap-1.5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-transparent"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-xs hidden group-hover:inline transition-opacity font-medium">Attach</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-zinc-700 hover:border-purple-500/50 hover:bg-zinc-800 transition-all select-none">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-zinc-400 font-medium tracking-wide">All models</span>
            </div>
          </div>

          {/* Right: multi-model badge + send */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-inner">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 tracking-wider">MULTI-MODEL</span>
            </div>

            <button
              id="send-btn"
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                canSubmit
                  ? "bg-white text-black hover:bg-zinc-200 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 text-center mt-2 font-medium select-none">
        Enter to send · Shift+Enter for newline
      </p>
    </form>
  );
}

