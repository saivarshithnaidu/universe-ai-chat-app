'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot, Star, Copy, Check, BarChart2, Loader2,
  Pencil, RotateCcw, ThumbsUp, X, Send
} from 'lucide-react';
import { getModelById } from '@/lib/models';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { ChatInput } from '@/components/ChatInput';
import { type ChatTurn, type ChatResponse } from '@/components/ChatInterface';
import clsx from 'clsx';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatViewProps {
  chatHistory: ChatTurn[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEditSubmit?: (turnIndex: number, newMessage: string) => void;
  selectedModelIds: string[];
  viewMode: 'best' | 'compare';
  preferredModel: string | null;
  onPreferModel: (modelId: string) => void;
  onViewModeChange: (mode: 'best' | 'compare') => void;
  enabledConnectorIds: string[];
  onToggleConnector: (id: string) => void;
  onOpenConnectors: () => void;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ChatView({
  chatHistory,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onEditSubmit,
  selectedModelIds,
  viewMode,
  preferredModel,
  onPreferModel,
  onViewModeChange,
  enabledConnectorIds,
  onToggleConnector,
  onOpenConnectors,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={clsx(
          'mx-auto px-4 py-8',
          viewMode === 'compare' ? 'max-w-7xl' : 'max-w-[760px]'
        )}>
          {isEmpty ? (
            <EmptyState
              selectedModelIds={selectedModelIds}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          ) : (
            <div className="space-y-10">
              {chatHistory.map((turn, i) => (
                <TurnBlock
                  key={i}
                  turn={turn}
                  turnIndex={i}
                  viewMode={viewMode}
                  preferredModel={preferredModel}
                  onPreferModel={onPreferModel}
                  onEditSubmit={onEditSubmit}
                  isLast={i === chatHistory.length - 1}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
          {isEmpty && <div ref={messagesEndRef} />}
        </div>
      </div>

      {/* ── Sticky Input ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-md px-4 py-4">
        <div className={clsx('mx-auto', viewMode === 'compare' ? 'max-w-4xl' : 'max-w-[760px]')}>
          <ChatInput
            input={input}
            setInput={(v) => onInputChange({ target: { value: v } } as any)}
            onSendMessage={() => onSubmit({ preventDefault: () => { } } as any)}
            isLoading={isLoading}
            enabledConnectorIds={enabledConnectorIds}
            onToggleConnector={onToggleConnector}
            onOpenConnectors={onOpenConnectors}
          />
          <p className="text-center text-[10px] text-zinc-700 mt-2 font-medium select-none">
            Universe AI may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Turn Block (user + AI response(s)) ──────────────────────────────────────

function TurnBlock({
  turn, turnIndex, viewMode, preferredModel, onPreferModel, onEditSubmit, isLast
}: {
  turn: ChatTurn;
  turnIndex: number;
  viewMode: 'best' | 'compare';
  preferredModel: string | null;
  onPreferModel: (id: string) => void;
  onEditSubmit?: (idx: number, msg: string) => void;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(turn.userMessage);

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== turn.userMessage && onEditSubmit) {
      onEditSubmit(turnIndex, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-5 animate-message">

      {/* ── User Message ────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <div className="group relative max-w-[75%]">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setIsEditing(false); }}
                autoFocus
                rows={3}
                className="w-full bg-zinc-900 border border-blue-500/50 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white resize-none outline-none leading-relaxed font-medium"
              />
              <div className="flex items-center gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-all">
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button onClick={commitEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all font-semibold">
                  <Send className="w-3 h-3" /> Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] leading-7 font-normal shadow-sm">
                {turn.userMessage}
              </div>
              {/* Hover actions */}
              <div className="absolute -bottom-7 right-0 hidden group-hover:flex items-center gap-1 transition-all">
                <MessageActionBtn
                  onClick={() => { setEditValue(turn.userMessage); setIsEditing(true); }}
                  title="Edit"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                />
                <CopyBtn text={turn.userMessage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── AI Responses ─────────────────────────────────────────────────── */}
      {viewMode === 'best' ? (
        <BestModeResponse
          response={turn.responses[0]}
          userMessage={turn.userMessage}
          onPreferModel={onPreferModel}
          preferredModel={preferredModel}
        />
      ) : (
        <CompareModeResponses
          responses={turn.responses}
          userMessage={turn.userMessage}
          preferredModel={preferredModel}
          onPreferModel={onPreferModel}
        />
      )}
    </div>
  );
}

// ─── Best Mode ────────────────────────────────────────────────────────────────

function BestModeResponse({
  response, userMessage, onPreferModel, preferredModel
}: {
  response?: ChatResponse;
  userMessage: string;
  onPreferModel: (id: string) => void;
  preferredModel: string | null;
}) {
  if (!response) return null;

  const model = getModelById(response.modelId) || {
    id: response.modelId,
    name: response.toolName || getModelDisplayName(response.modelId),
    provider: getModelProvider(response.modelId),
    description: '',
    modelId: response.modelId,
  };

  const isBusy = response.status === 'busy';
  const isFailed = response.status === 'failed';

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
        isBusy ? 'bg-zinc-900 border-zinc-700' :
          isFailed ? 'bg-red-950/40 border-red-900/60' :
            'bg-zinc-900 border-zinc-800'
      )}>
        {isBusy
          ? <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          : <ModelAvatar modelId={response.modelId} />
        }
      </div>

      <div className="flex-1 min-w-0">
        {/* Model name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wide">{model.name}</span>
          {response.status === 'success' && (
            <span className="text-[9px] font-bold text-green-500/70 uppercase tracking-wider">Done</span>
          )}
        </div>

        {/* Content bubble */}
        <div className={clsx(
          'rounded-2xl rounded-tl-sm border overflow-hidden',
          isFailed
            ? 'bg-red-950/20 border-red-800/40'
            : 'bg-zinc-900/60 border-zinc-800/50'
        )}>
          <div className="px-5 py-4">
            <ModelResponseCard
              model={model as any}
              messages={[
                { role: 'user', content: userMessage },
                { role: 'assistant', content: response.text },
              ]}
              status={response.status}
              error={response.error}
              type={response.type === 'tool' ? 'tool' : 'llm'}
              toolName={response.toolName}
              isLoading={isBusy}
            />
          </div>
        </div>

        {/* Hover actions */}
        {!isBusy && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CopyBtn text={response.text} />
            <MessageActionBtn
              onClick={() => onPreferModel(response.modelId)}
              title="Prefer this model"
              icon={<Star className={clsx('w-3.5 h-3.5', preferredModel === response.modelId ? 'text-amber-400' : '')} />}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Compare Mode ─────────────────────────────────────────────────────────────

function CompareModeResponses({
  responses, userMessage, preferredModel, onPreferModel
}: {
  responses: ChatResponse[];
  userMessage: string;
  preferredModel: string | null;
  onPreferModel: (id: string) => void;
}) {
  if (!responses?.length) return null;

  const total = responses.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">
          Comparing {total} model{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className={clsx(
        'grid gap-5',
        total === 1 ? 'grid-cols-1 max-w-[760px]' :
          total === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      )}>
        {responses.map((res, j) => (
          <CompareCard
            key={j}
            response={res}
            userMessage={userMessage}
            isPreferred={preferredModel === res.modelId}
            onPrefer={() => onPreferModel(res.modelId)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Compare Card ─────────────────────────────────────────────────────────────

function CompareCard({
  response, userMessage, isPreferred, onPrefer
}: {
  response: ChatResponse;
  userMessage: string;
  isPreferred: boolean;
  onPrefer: () => void;
}) {
  const model = getModelById(response.modelId) || {
    id: response.modelId,
    name: response.toolName || getModelDisplayName(response.modelId),
    provider: getModelProvider(response.modelId),
    description: '',
    modelId: response.modelId,
  };

  const isBusy = response.status === 'busy';
  const isFailed = response.status === 'failed';
  const isSuccess = response.status === 'success';

  return (
    <div className={clsx(
      'flex flex-col rounded-2xl border bg-zinc-900/50 overflow-hidden transition-all duration-200',
      isPreferred ? 'border-amber-500/40 ring-1 ring-amber-500/20' :
        isFailed ? 'border-red-800/50' :
          'border-zinc-800/60 hover:border-zinc-700/60'
    )}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/80">
        <div className="flex items-center gap-2.5">
          <ModelAvatar modelId={response.modelId} />
          <span className="text-[13px] font-semibold text-zinc-200">{model.name}</span>
          {isPreferred && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5" /> Preferred
            </span>
          )}
        </div>
        {/* Status pill */}
        <div className={clsx(
          'flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
          isBusy ? 'text-zinc-500 bg-zinc-800/60 border-zinc-700' :
            isSuccess ? 'text-green-500 bg-green-500/10 border-green-500/20' :
              'text-red-400 bg-red-500/10 border-red-500/20'
        )}>
          {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
          {isBusy ? 'Thinking' : isSuccess ? 'Done' : 'Failed'}
        </div>
      </div>

      {/* Card Body — scrollable */}
      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar px-5 py-4 text-[15px] leading-7">
        <ModelResponseCard
          model={model as any}
          messages={[
            { role: 'user', content: userMessage },
            { role: 'assistant', content: response.text },
          ]}
          status={response.status}
          error={response.error}
          type={response.type === 'tool' ? 'tool' : 'llm'}
          toolName={response.toolName}
          isLoading={isBusy}
        />
      </div>

      {/* Card Footer actions */}
      {(isSuccess || isFailed) && (
        <div className="flex items-center gap-1 px-4 py-2.5 border-t border-zinc-800/60 bg-zinc-950/30">
          <button
            onClick={onPrefer}
            disabled={isPreferred}
            title="Use this model as preferred"
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
              isPreferred
                ? 'text-amber-400 bg-amber-500/10 cursor-default'
                : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10'
            )}
          >
            <Star className="w-3.5 h-3.5" />
            {isPreferred ? 'Preferred' : 'Prefer'}
          </button>

          {isSuccess && <CopyBtn text={response.text} compact />}

          {isFailed && (
            <span className="ml-auto text-[10px] text-red-400 font-medium">
              {response.error || 'Model failed'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared Action Buttons ────────────────────────────────────────────────────

function MessageActionBtn({ onClick, title, icon }: { onClick: () => void; title: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

function CopyBtn({ text, compact }: { text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {!compact && <span>{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  );
}

// ─── Model Avatar ─────────────────────────────────────────────────────────────

function ModelAvatar({ modelId }: { modelId: string }) {
  const c =
    modelId.includes('gpt') ? 'text-green-400' :
      modelId.includes('claude') ? 'text-orange-400' :
        modelId.includes('gemini') ? 'text-blue-400' :
          modelId.includes('llama') ? 'text-cyan-400' :
            modelId.includes('deepseek') ? 'text-purple-400' :
              modelId.includes('mistral') ? 'text-yellow-400' :
                'text-zinc-500';
  return <Bot className={clsx('w-4 h-4', c)} />;
}

function getModelDisplayName(id: string) {
  if (id === 'gemini-agent') return 'Gemini Agent';
  if (id.includes('gpt-4o-mini')) return 'GPT-4o Mini';
  if (id.includes('gpt-4o')) return 'GPT-4o';
  if (id.includes('claude')) return 'Claude';
  if (id.includes('gemini')) return 'Gemini';
  if (id.includes('llama')) return 'LLaMA';
  if (id.includes('deepseek')) return 'DeepSeek';
  if (id.includes('mistral')) return 'Mistral';
  return 'AI';
}

function getModelProvider(id: string) {
  if (id.includes('gpt') || id.includes('openai')) return 'OpenAI';
  if (id.includes('claude') || id.includes('anthropic')) return 'Anthropic';
  if (id.includes('gemini') || id.includes('google')) return 'Google';
  if (id.includes('llama') || id.includes('meta')) return 'Meta';
  if (id.includes('deepseek')) return 'DeepSeek';
  if (id.includes('mistral')) return 'Mistral';
  return 'AI';
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Explain RAG in simple terms', icon: '📚' },
  { label: 'Build a React todo app', icon: '⚛️' },
  { label: 'Write a cold outreach email', icon: '✉️' },
  { label: 'Debug my Python script', icon: '🐍' },
  { label: 'Compare GPT-4o vs Claude', icon: '⚡' },
  { label: 'Summarize this document', icon: '📄' },
];

function EmptyState({
  selectedModelIds, viewMode, onViewModeChange
}: {
  selectedModelIds: string[];
  viewMode: 'best' | 'compare';
  onViewModeChange: (m: 'best' | 'compare') => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] text-center px-4">
      {/* Glow + icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/15 blur-3xl rounded-full scale-[2]" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-zinc-800 flex items-center justify-center shadow-2xl">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      <h1 className="text-[28px] font-bold text-white mb-2 tracking-tight">How can I help you?</h1>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => onViewModeChange('best')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            viewMode === 'best'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
          )}
        >
          <Star className="w-3.5 h-3.5" />
          Best Answer
        </button>
        <button
          onClick={() => onViewModeChange('compare')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            viewMode === 'compare'
              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
          )}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Compare {selectedModelIds.length > 1 ? `${selectedModelIds.length} models` : 'models'}
        </button>
      </div>

      {/* Prompt suggestions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-xl">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            id={`suggestion-${i}`}
            onClick={() => {
              const ta = document.querySelector<HTMLTextAreaElement>('textarea');
              if (!ta) return;
              Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(ta, s.label);
              ta.dispatchEvent(new Event('input', { bubbles: true }));
              ta.focus();
            }}
            className="text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-200 group"
          >
            <p className="text-sm text-zinc-400 group-hover:text-white transition-colors leading-snug">{s.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
