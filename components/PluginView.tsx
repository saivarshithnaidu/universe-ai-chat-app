'use client';

import { FileText, Search, Briefcase, Globe, Sparkles } from 'lucide-react';
import { ChatInput } from '@/components/ChatInput';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { getModelById } from '@/lib/models';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

type PluginType = 'resume' | 'docs' | 'jobs' | 'web';

const PLUGIN_CONFIG: Record<
  PluginType,
  { icon: React.ElementType; color: string; title: string; tagline: string; placeholder: string }
> = {
  resume: {
    icon: FileText,
    color: 'text-green-400',
    title: 'Resume Analyzer',
    tagline: 'ATS scoring, keyword optimization, and gap analysis for your resume.',
    placeholder: 'Paste your resume text or describe your job target…',
  },
  docs: {
    icon: Search,
    color: 'text-orange-400',
    title: 'Document Search',
    tagline: 'Upload or paste documents and ask anything about them.',
    placeholder: 'Ask about your documents…',
  },
  jobs: {
    icon: Briefcase,
    color: 'text-pink-400',
    title: 'Job Finder',
    tagline: 'Describe your skills and desired role to discover relevant opportunities.',
    placeholder: 'Describe your ideal role or skills…',
  },
  web: {
    icon: Globe,
    color: 'text-indigo-400',
    title: 'Web Search',
    tagline: 'Search the live web for real-time information and sources.',
    placeholder: 'Search the web for…',
  },
};

interface ChatTurn {
  userMessage: string;
  responses: {
    modelId: string;
    text: string;
    status: 'busy' | 'success' | 'failed';
    type?: string;
    toolName?: string;
  }[];
}

interface PluginViewProps {
  type: PluginType;
  chatHistory: ChatTurn[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PluginView({
  type,
  chatHistory,
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: PluginViewProps) {
  const config = PLUGIN_CONFIG[type];
  const Icon = config.icon;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Messages / Empty State */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty ? (
            <PluginEmptyState config={config} Icon={Icon} />
          ) : (
            <div className="space-y-6">
              {chatHistory.map((turn, i) => (
                <div key={i} className="animate-message space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-white text-zinc-900 rounded-2xl px-4 py-3 max-w-[75%] text-sm font-medium leading-relaxed shadow-sm">
                      {turn.userMessage}
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="flex flex-col gap-4">
                    {turn.responses.map((res, j) => {
                      const model = getModelById(res.modelId) || {
                        id: res.modelId,
                        name: res.toolName || 'AI',
                        provider: 'System',
                        description: '',
                        modelId: res.modelId,
                      };
                      return (
                        <div key={`${i}-${j}`} className="flex gap-3">
                          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className={clsx('w-4 h-4', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4 py-3">
                            <ModelResponseCard
                              model={model as any}
                              messages={[
                                { role: 'user', content: turn.userMessage },
                                { role: 'assistant', content: res.text },
                              ]}
                              status={res.status}
                              type={res.type === 'tool' ? 'tool' : 'llm'}
                              toolName={res.toolName}
                              isLoading={res.status === 'busy'}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
          {isEmpty && <div ref={messagesEndRef} />}
        </div>
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 border-t border-zinc-800/60 bg-zinc-950 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            input={input}
            setInput={(value) => onInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
            onSendMessage={() => onSubmit({ preventDefault: () => {} } as React.FormEvent)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

function PluginEmptyState({
  config,
  Icon,
}: {
  config: (typeof PLUGIN_CONFIG)[PluginType];
  Icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-3xl rounded-full scale-150 opacity-20 bg-current" />
        <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
          <Icon className={clsx('w-8 h-8', config.color)} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{config.title}</h2>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">{config.tagline}</p>
    </div>
  );
}
