'use client';

import React, { useState } from 'react';
import { AIModel } from '@/lib/models';
import { Bot, RefreshCw, Loader2, Copy, Check, Briefcase, Globe, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelResponseCardProps {
  model: AIModel;
  messages: { role: string; content: string }[];
  isLoading: boolean;
  error?: string;
  status?: 'success' | 'failed' | 'busy';
  type?: 'llm' | 'tool';
  toolName?: string;
  note?: string;
  onRetry?: () => void;
}

// ─── Plugin Renderer ─────────────────────────────────────────────────────────

function PluginRenderer({ toolName, content }: { toolName: string; content: string }) {
  if (!content) return null;

  if (toolName?.toLowerCase().includes('resume')) {
    const scoreMatch = content.match(/(\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const circumference = 2 * Math.PI * 38;
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-2">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
              <circle
                cx="42" cy="42" r="38"
                stroke="currentColor" strokeWidth="6" fill="transparent"
                className={score > 70 ? 'text-green-500' : score > 40 ? 'text-amber-500' : 'text-red-500'}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-white">{score}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold">ATS</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-base font-bold text-white">Resume Analysis</h3>
            <div className="flex flex-wrap gap-1.5">
              {content.includes('keywords') && (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold rounded-md uppercase">
                  ✓ Keywords
                </span>
              )}
              {content.includes('format') && (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-md uppercase">
                  ✓ Format
                </span>
              )}
            </div>
            <div className="prose-ai">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {content.length > 250 ? content.slice(0, 250) + '…' : content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <MarkdownRenderer content={content} />;
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Parse markdown into sections
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inCode = false;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Code block start/end
    if (line.startsWith('```')) {
      if (inCode) {
        // End code block
        elements.push(
          <pre key={`code-${i}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 my-3 overflow-x-auto">
            <code className="text-[13px] text-zinc-300 font-mono leading-relaxed whitespace-pre">
              {codeBuffer.join('\n')}
            </code>
          </pre>
        );
        codeBuffer = [];
        codeLang = '';
        inCode = false;
      } else {
        codeLang = line.slice(3).trim();
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuffer.push(raw);
      i++;
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-zinc-200 mt-4 mb-1">{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-white mt-5 mb-1.5">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-white mt-5 mb-2">{trimmed.slice(2)}</h1>);
    }
    // Numbered list
    else if (/^\d+[.)]\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)[.)]\s+(.+)/);
      if (match) {
        elements.push(
          <div key={i} className="flex items-start gap-2.5 my-1.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center mt-px">
              {match[1]}
            </span>
            <span className="text-sm text-zinc-300 leading-relaxed">{renderInline(match[2])}</span>
          </div>
        );
      }
    }
    // Horizontal rule
    else if (/^[-=]{3,}$/.test(trimmed)) {
      elements.push(<hr key={i} className="border-zinc-800 my-3" />);
    }
    // Bullet list
    else if (/^[-•*]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-•*]\s+/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span className="text-sm text-zinc-300 leading-relaxed">{renderInline(text)}</span>
        </div>
      );
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-zinc-700 pl-3 my-2 text-zinc-500 italic text-sm">
          {trimmed.slice(2)}
        </blockquote>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="text-sm text-zinc-300 leading-[1.8] mb-1.5">
          {renderInline(trimmed)}
        </p>
      );
    }
    i++;
  }

  return <div className="prose-ai space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**, *italic*, `code`, [link](url)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={idx} className="italic text-zinc-400">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={idx} className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[12px] text-blue-300 font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a key={idx} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30 transition-colors">
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

// ─── Model Icon ───────────────────────────────────────────────────────────────

function ModelIcon({ modelId }: { modelId: string }) {
  if (modelId.includes('gpt'))       return <Bot className="w-4 h-4 text-green-400" />;
  if (modelId.includes('claude'))    return <Bot className="w-4 h-4 text-orange-400" />;
  if (modelId.includes('gemini') || modelId.includes('gemini-agent'))
                                     return <Bot className="w-4 h-4 text-blue-400" />;
  if (modelId.includes('llama'))     return <Bot className="w-4 h-4 text-cyan-400" />;
  if (modelId.includes('deepseek'))  return <Bot className="w-4 h-4 text-purple-400" />;
  if (modelId.includes('mistral'))   return <Bot className="w-4 h-4 text-yellow-400" />;
  return <Bot className="w-4 h-4 text-zinc-400" />;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-zinc-700 typing-dot" />
          <span className="w-2 h-2 rounded-full bg-zinc-700 typing-dot" />
          <span className="w-2 h-2 rounded-full bg-zinc-700 typing-dot" />
        </div>
        <span className="text-xs text-zinc-600 font-medium">Thinking…</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full w-3/4 animate-pulse" />
      <div className="h-3 bg-zinc-800/60 rounded-full w-1/2 animate-pulse" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ModelResponseCard({
  model,
  messages,
  isLoading,
  error,
  status,
  type,
  toolName,
  note,
  onRetry,
}: ModelResponseCardProps) {
  const lastMsg = messages[messages.length - 1];
  const content = lastMsg?.role === 'assistant' ? lastMsg.content : '';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Loading state
  if (isLoading && !content && !error) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ModelIcon modelId={model.id} />
          <span className="text-sm font-semibold text-zinc-400">{model.name}</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error / Failed state
  if (error || status === 'failed') {
    return (
      <div className="flex flex-col items-start gap-3 py-3">
        <div className="flex items-center gap-2">
          <ModelIcon modelId={model.id} />
          <span className="text-sm font-semibold text-zinc-400">{model.name}</span>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 w-full">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-red-400 opacity-60" />
            <p className="text-sm font-semibold text-red-300">Response unavailable</p>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {error || "The model is currently busy or restricted. Please retry or select a different model."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      {/* Model Name Row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <ModelIcon modelId={model.id} />
          <span className="text-sm font-semibold text-zinc-300">
            {type === 'tool' ? (toolName || 'Plugin') : model.name}
          </span>
          {type === 'tool' && (
            <span className="text-[9px] text-purple-400 font-bold px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full uppercase tracking-wide">
              Plugin
            </span>
          )}
        </div>

        {content && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-md"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="break-anywhere">
        {type === 'tool' ? (
          <PluginRenderer toolName={toolName || ''} content={content} />
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>

      {note && <p className="text-[11px] text-zinc-600 mt-2 italic">{note}</p>}
    </div>
  );
}
