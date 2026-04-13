'use client';

import React, { useState } from 'react';
import {
  Globe, Briefcase, FileText, File, Code, Mail, BookOpen,
  Zap, Rocket, Users, CheckCircle, XCircle, ExternalLink,
  Copy, Check, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import clsx from 'clsx';

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const TOOL_ICON_MAP: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  web_search:       { Icon: Globe,      color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  job_search:       { Icon: Briefcase,  color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/30'   },
  resume_analyzer:  { Icon: FileText,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  pdf_reader:       { Icon: File,       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  web_scraper:      { Icon: Code,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  gmail_tool:       { Icon: Mail,       color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'     },
  notion_tool:      { Icon: BookOpen,   color: 'text-zinc-300',   bg: 'bg-zinc-500/10 border-zinc-500/30'   },
  apify_tool:       { Icon: Zap,        color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'   },
  deploy_tool:      { Icon: Rocket,     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  crm_tool:         { Icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'   },
};

function getToolMeta(toolKey: string) {
  return TOOL_ICON_MAP[toolKey] || { Icon: Zap, color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' };
}

// ─── Execution Status Bar ─────────────────────────────────────────────────────

export function ToolStatusBar({
  toolName,
  toolKey,
  status,
}: {
  toolName: string;
  toolKey: string;
  status: 'busy' | 'success' | 'failed';
}) {
  const { Icon, color, bg } = getToolMeta(toolKey);
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold mb-3',
      status === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-300' :
      status === 'failed'  ? 'bg-red-500/5 border-red-500/20 text-red-300' :
      'bg-zinc-900 border-zinc-800 text-zinc-400'
    )}>
      <div className={clsx('w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={clsx('w-3.5 h-3.5', color)} />
      </div>
      <div className="flex-1">
        <span className="text-zinc-500 font-medium text-xs">Using tool: </span>
        <span className="text-white font-bold">{toolName}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {status === 'busy' && (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        {status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
        {status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
        <span className="text-xs">
          {status === 'busy' ? 'Processing…' : status === 'success' ? 'Completed' : 'Failed'}
        </span>
      </div>
    </div>
  );
}

// ─── Search Results Card ──────────────────────────────────────────────────────

function SearchResultsCard({ results, query }: { results: any[]; query: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {results.map((r, i) => (
        <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
          className="block p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug flex-1">
              {r.title}
            </p>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{r.snippet}</p>
          <p className="text-[10px] text-zinc-700 mt-1.5 truncate">{r.link}</p>
        </a>
      ))}
    </div>
  );
}

// ─── Job Cards ────────────────────────────────────────────────────────────────

function JobCards({ jobs, query }: { jobs: any[]; query: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {jobs.length} opening{jobs.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {jobs.map((j, i) => (
        <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug">{j.title}</p>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">{j.company}</p>
            </div>
            {j.type && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 flex-shrink-0">
                {j.type}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            📍 {j.location}
          </p>
          {j.apply_link && (
            <a href={j.apply_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 px-3 py-1.5 rounded-lg transition-all">
              Apply Now <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Resume Score Card ────────────────────────────────────────────────────────

function ResumeScoreCard({ score }: { score: number | null }) {
  if (score === null) return null;
  const circumference = 2 * Math.PI * 30;
  const color = score >= 70 ? 'text-green-500' : score >= 45 ? 'text-amber-500' : 'text-red-500';
  const label = score >= 70 ? 'ATS Ready' : score >= 45 ? 'Needs Work' : 'Rewrite';

  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl mb-3">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r="30" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
          <circle cx="34" cy="34" r="30" stroke="currentColor" strokeWidth="6" fill="transparent"
            className={color}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * score) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{score}</span>
          <span className="text-[8px] text-zinc-500 uppercase font-bold">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-white">ATS Score</p>
        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block',
          score >= 70 ? 'text-green-400 bg-green-500/10 border-green-500/30' :
          score >= 45 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
          'text-red-400 bg-red-500/10 border-red-500/30'
        )}>
          {label}
        </span>
        <p className="text-xs text-zinc-500 mt-1">Based on ATS analysis</p>
      </div>
    </div>
  );
}

// ─── Email Draft Card ─────────────────────────────────────────────────────────

function EmailDraftCard({ subject, body }: { subject: string; body: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-zinc-300 truncate">Subject: {subject}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 bg-zinc-950 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
        {body.split('**Body:**').pop()?.replace(/^\n+/, '').trim() || body}
      </div>
    </div>
  );
}

// ─── Lead Cards ───────────────────────────────────────────────────────────────

function LeadCards({ leads, query }: { leads: any[]; query: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {leads.length} lead{leads.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {leads.map((l, i) => (
        <a key={i} href={l.link} target="_blank" rel="noopener noreferrer"
          className="block p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group">
          <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{l.title}</p>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{l.snippet}</p>
          <p className="text-[10px] text-blue-500 mt-1 truncate">{l.link}</p>
        </a>
      ))}
    </div>
  );
}

// ─── Markdown Renderer (shared) ───────────────────────────────────────────────

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm text-zinc-300 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith('### ')) return <h3 key={i} className="font-bold text-zinc-200 mt-3 mb-1 text-sm">{trimmed.slice(4)}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="font-bold text-white mt-4 mb-1">{trimmed.slice(3)}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="font-bold text-white mt-4 mb-1 text-base">{trimmed.slice(2)}</h1>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return <div key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" /><span>{renderInline(trimmed.slice(2))}</span></div>;
        }
        if (/^\d+\./.test(trimmed)) {
          return <div key={i} className="flex items-start gap-2"><span className="text-zinc-600 font-bold text-xs mt-0.5 flex-shrink-0 w-4">{trimmed.match(/^(\d+)\./)?.[1]}.</span><span>{renderInline(trimmed.replace(/^\d+\.\s*/, ''))}</span></div>;
        }
        if (/^---+$/.test(trimmed)) return <hr key={i} className="border-zinc-800 my-2" />;
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) return <em key={i} className="italic text-zinc-400">{part.slice(1, -1)}</em>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-zinc-800 rounded px-1.5 py-0.5 text-[11px] text-blue-300 font-mono">{part.slice(1, -1)}</code>;
        const link = part.match(/\[(.*?)\]\((.*?)\)/);
        if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">{link[1]}</a>;
        return part;
      })}
    </>
  );
}

// ─── Main Tool Result Card ────────────────────────────────────────────────────

export function ToolResultCard({
  toolKey,
  toolName,
  status,
  text,
  data,
  error,
}: {
  toolKey: string;
  toolName: string;
  status: 'busy' | 'success' | 'failed';
  text: string;
  data?: any;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const { Icon, color, bg } = getToolMeta(toolKey);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/60">
        <div className={clsx('w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0', bg)}>
          <Icon className={clsx('w-3.5 h-3.5', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-white">{toolName}</span>
          <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase border bg-zinc-800 text-zinc-400 border-zinc-700">Tool</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
          {status === 'failed'  && <XCircle className="w-4 h-4 text-red-400" />}
          {status === 'busy'    && (
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                  style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          )}
          <button onClick={() => setExpanded(v => !v)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4">
          {status === 'failed' ? (
            <div className="text-sm text-red-400 font-medium">
              {error || text}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rich structured data */}
              {data?.results && toolKey === 'web_search' && (
                <SearchResultsCard results={data.results} query={data.query || ''} />
              )}
              {data?.results && toolKey === 'web_scraper' && (
                <SearchResultsCard results={data.results} query="Extracted Data" />
              )}
              {data?.results && toolKey === 'apify_tool' && (
                <SearchResultsCard results={data.results} query={data.query || 'Scraped'} />
              )}
              {data?.jobs && toolKey === 'job_search' && (
                <JobCards jobs={data.jobs} query={data.query || ''} />
              )}
              {data?.score !== undefined && toolKey === 'resume_analyzer' && (
                <ResumeScoreCard score={data.score} />
              )}
              {data?.subject && toolKey === 'gmail_tool' && (
                <EmailDraftCard subject={data.subject} body={data.body} />
              )}
              {data?.leads && toolKey === 'crm_tool' && (
                <LeadCards leads={data.leads} query={data.query || ''} />
              )}

              {/* Markdown text fallback (always rendered for full context) */}
              {toolKey !== 'gmail_tool' && text && (
                <div className={clsx(
                  data?.results || data?.jobs || data?.leads ? 'hidden' : ''
                )}>
                  <MarkdownText content={text} />
                </div>
              )}
              {/* For tools that only generate text (resume, notion, pdf, deploy, email) */}
              {(toolKey === 'resume_analyzer' || toolKey === 'notion_tool' || toolKey === 'pdf_reader' || toolKey === 'deploy_tool') && text && (
                <MarkdownText content={text} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
