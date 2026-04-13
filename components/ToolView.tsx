'use client';

import { useEffect, useRef } from 'react';
import { ChatInput } from '@/components/ChatInput';
import { ToolResultCard } from '@/components/ToolResultCard';
import { TOOL_REGISTRY } from '@/lib/tools/registry';
import { type ChatTurn, type ChatResponse } from '@/components/ChatInterface';
import {
  Globe, Briefcase, FileText, File, Code, Mail, BookOpen,
  Zap, Rocket, Users
} from 'lucide-react';
import clsx from 'clsx';

// ─── Tool Metadata (mirrors registry, client-safe) ────────────────────────────

const TOOL_META: Record<string, {
  name: string;
  tagline: string;
  placeholder: string;
  Icon: React.ElementType;
  color: string;
}> = {
  web_search:      { name: 'Web Search',      tagline: 'Search the real-time web using Serper.',                Icon: Globe,     color: 'text-indigo-400', placeholder: 'Search the web for…' },
  job_search:      { name: 'Job Finder',       tagline: 'Find real job listings from JSearch API.',              Icon: Briefcase, color: 'text-pink-400',   placeholder: 'Frontend engineer jobs in Bangalore…' },
  resume_analyzer: { name: 'Resume Analyzer',  tagline: 'ATS scoring, keywords, and gap analysis.',             Icon: FileText,  color: 'text-green-400',  placeholder: 'Paste your resume text here…' },
  pdf_reader:      { name: 'Document Reader',  tagline: 'Summarize and extract key info from documents.',        Icon: File,      color: 'text-orange-400', placeholder: 'Paste document text or describe it…' },
  web_scraper:     { name: 'Web Scraper',      tagline: 'Extract structured data from URLs.',                    Icon: Code,      color: 'text-yellow-400', placeholder: 'Scrape https://example.com for prices…' },
  gmail_tool:      { name: 'Email Drafter',    tagline: 'Draft professional emails in seconds.',                 Icon: Mail,      color: 'text-red-400',    placeholder: 'Write an email to request a meeting…' },
  notion_tool:     { name: 'Notion Writer',    tagline: 'Format content for Notion pages.',                      Icon: BookOpen,  color: 'text-zinc-300',   placeholder: 'Format my meeting notes for Notion…' },
  apify_tool:      { name: 'Advanced Scraper', tagline: 'Advanced web data extraction via Apify.',               Icon: Zap,       color: 'text-cyan-400',   placeholder: 'Scrape product reviews from…' },
  deploy_tool:     { name: 'Deploy to Vercel', tagline: 'Deploy your project to production.',                    Icon: Rocket,    color: 'text-violet-400', placeholder: 'How do I deploy my project?…' },
  crm_tool:        { name: 'Lead Finder',      tagline: 'Find qualified leads and business contacts.',           Icon: Users,     color: 'text-blue-400',   placeholder: 'Find SaaS CTOs in Mumbai…' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToolViewProps {
  toolKey: string;
  chatHistory: ChatTurn[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ToolView({
  toolKey,
  chatHistory,
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ToolViewProps) {
  const meta = TOOL_META[toolKey];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!meta) return null;
  const { Icon, color } = meta;
  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {isEmpty ? (
            <ToolEmptyState meta={meta} Icon={Icon} color={color} />
          ) : (
            <div className="space-y-6">
              {chatHistory.map((turn, i) => (
                <div key={i} className="space-y-3 animate-fade-in">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-white text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm font-medium leading-relaxed shadow-sm">
                      {turn.userMessage}
                    </div>
                  </div>

                  {/* Tool responses */}
                  {turn.responses.map((res, j) => (
                    <ToolResponse key={j} response={res} />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
          {isEmpty && <div ref={messagesEndRef} />}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-800/60 bg-zinc-950 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            input={input}
            setInput={(v) => onInputChange({ target: { value: v } } as any)}
            onSendMessage={() => onSubmit({ preventDefault: () => {} } as any)}
            isLoading={isLoading}
            placeholder={meta.placeholder}
            enabledConnectorIds={[]}
            onToggleConnector={() => {}}
            onOpenConnectors={() => {}}
          />
          <p className="text-center text-[10px] text-zinc-700 mt-2 font-medium">
            Real tool execution — results may take a few seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Individual Tool Response ─────────────────────────────────────────────────

function ToolResponse({ response }: { response: ChatResponse }) {
  // Use ToolResultCard for tool responses
  if (response.type === 'tool' || response.toolKey) {
    const rToolKey = response.toolKey || response.modelId;
    const rToolName = response.toolName || TOOL_META[rToolKey]?.name || rToolKey;
    return (
      <ToolResultCard
        toolKey={rToolKey}
        toolName={rToolName}
        status={response.status === 'busy' ? 'busy' : response.status}
        text={response.text}
        data={response.data}
        error={response.error}
      />
    );
  }

  // Fallback: plain text
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-4 py-3">
      <p className="text-sm text-zinc-300 leading-relaxed">{response.text}</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function ToolEmptyState({
  meta,
  Icon,
  color,
}: {
  meta: typeof TOOL_META[string];
  Icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className={clsx('absolute inset-0 blur-3xl rounded-full scale-150 opacity-20', color.replace('text-', 'bg-'))} />
        <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
          <Icon className={clsx('w-8 h-8', color)} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{meta.name}</h2>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-8">{meta.tagline}</p>

      {/* Execution flow indicators */}
      <div className="flex items-center gap-3 text-xs text-zinc-600 font-semibold">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className={clsx('w-2 h-2 rounded-full', color.replace('text-', 'bg-'))} />
          Detect intent
        </div>
        <div className="w-4 h-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className={clsx('w-2 h-2 rounded-full', color.replace('text-', 'bg-'))} />
          Execute tool
        </div>
        <div className="w-4 h-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Show results
        </div>
      </div>
    </div>
  );
}
