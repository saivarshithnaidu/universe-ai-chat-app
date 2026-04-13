'use client';

import {
  Sparkles, Code, Globe, Bot
} from 'lucide-react';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import { ChatInput } from '@/components/ChatInput';
import clsx from 'clsx';

type AgentStep = 'idle' | 'thinking' | 'planning' | 'generating' | 'building';

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

interface AgentWorkspaceProps {
  chatHistory: ChatTurn[];
  input: string;
  isLoading: boolean;
  agentStep: AgentStep;
  projectFiles: Record<string, string> | null;
  projectFramework: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeploy: () => void;
  isDeploying: boolean;
  deployUrl: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function AgentWorkspace({
  chatHistory,
  input,
  isLoading,
  agentStep,
  projectFiles,
  projectFramework,
  onInputChange,
  onSubmit,
  onDeploy,
  isDeploying,
  deployUrl,
  messagesEndRef,
}: AgentWorkspaceProps) {
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Generation Overlay */}
      {isLoading && agentStep !== 'idle' && (
        <div className="absolute inset-0 z-50 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-sm w-full space-y-6 text-center px-6">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
              <Sparkles className="w-12 h-12 text-cyan-400 relative animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                {agentStep === 'thinking'   ? '💡 Thinking...'           :
                 agentStep === 'planning'   ? '🧠 Planning Architecture..' :
                 agentStep === 'generating' ? '⚙️ Writing Code...'       :
                                             '🚀 Launching Preview...'}
              </h2>
              <p className="text-xs text-zinc-500">AI is building your project</p>
            </div>

            <div className="space-y-2">
              {(['thinking', 'planning', 'generating', 'building'] as AgentStep[]).map((step, idx) => {
                const steps: AgentStep[] = ['thinking', 'planning', 'generating', 'building'];
                const isDone = steps.indexOf(agentStep) > idx;
                const isActive = agentStep === step;
                const labels = [
                  'Analyzing Requirements',
                  'Designing Architecture',
                  'Writing Components',
                  'Launching Preview',
                ];
                return (
                  <div
                    key={step}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all',
                      isActive ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 scale-105' :
                      isDone  ? 'border-green-500/20 text-green-400/70'  :
                                'border-zinc-800 text-zinc-600'
                    )}
                  >
                    <span className="text-base">{isDone ? '✅' : isActive ? '⏳' : '○'}</span>
                    <span className="font-medium text-left">{labels[idx]}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
        {/* LEFT: Architect Panel */}
        <Panel defaultSize={22} minSize={16} className="flex flex-col border-r border-zinc-800/60">
          <div className="h-9 flex items-center px-4 border-b border-zinc-800/60 bg-zinc-900/40">
            <Bot className="w-3.5 h-3.5 text-zinc-500 mr-2" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
              Architect
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-30">
                <Bot className="w-10 h-10 mb-3 text-zinc-600" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Describe what to build
                </p>
              </div>
            ) : (
              chatHistory.map((m, i) => (
                <div key={i} className="space-y-2">
                  {/* User message */}
                  <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                      You
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed break-anywhere">
                      {m.userMessage}
                    </p>
                  </div>

                  {/* Agent response summary */}
                  {m.responses?.[0]?.text && m.responses[0].status !== 'busy' && (
                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-1.5">
                        Agent
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed break-anywhere line-clamp-3">
                        {m.responses[0].text.substring(0, 150)}
                        {m.responses[0].text.length > 150 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800/60 p-2">
            <ChatInput
              input={input}
              setInput={(value) => onInputChange({ target: { value } } as React.ChangeEvent<HTMLTextAreaElement>)}
              onSendMessage={() => onSubmit({ preventDefault: () => {} } as React.FormEvent)}
              isLoading={isLoading}
            />
          </div>
        </Panel>

        <PanelResizeHandle
          className="w-px bg-zinc-800/60 hover:bg-zinc-600 transition-colors cursor-col-resize"
        />

        {/* CENTER: Code Editor */}
        <Panel defaultSize={43} minSize={20} className="flex flex-col">
          <div className="h-9 flex items-center px-4 border-b border-zinc-800/60 bg-zinc-900/40">
            <Code className="w-3.5 h-3.5 text-cyan-400 mr-2" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
              Workspace
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            {projectFiles ? (
              <SandpackProvider
                className="h-full flex flex-col"
                template={projectFramework === 'html' ? 'static' : 'react'}
                theme={atomDark}
                files={projectFiles}
                options={{ recompileMode: 'delayed', recompileDelay: 500 }}
              >
                <SandpackLayout className="flex-1 !border-none !rounded-none !bg-transparent h-full">
                  <SandpackFileExplorer className="!bg-zinc-950 !border-r !border-zinc-800 h-full" />
                  <SandpackCodeEditor
                    showLineNumbers
                    showTabs
                    style={{ height: '100%', fontSize: '13px', fontFamily: '"Fira Code", monospace' }}
                  />
                </SandpackLayout>
              </SandpackProvider>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 bg-zinc-950">
                <Code className="w-12 h-12 text-zinc-600 mb-3" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center px-6">
                  Describe a project to get started
                </p>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle
          className="w-px bg-zinc-800/60 hover:bg-zinc-600 transition-colors cursor-col-resize"
        />

        {/* RIGHT: Preview */}
        <Panel defaultSize={35} minSize={15} className="flex flex-col border-l border-zinc-800/60">
          <div className="h-9 flex items-center justify-between px-4 border-b border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                Preview
              </span>
            </div>

            <button
              id="deploy-btn"
              onClick={onDeploy}
              disabled={isDeploying || !projectFiles}
              className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeploying ? 'Deploying...' : deployUrl ? '✓ Deployed' : 'Deploy'}
            </button>
          </div>

          <div className="flex-1 bg-white relative overflow-hidden">
            {projectFiles ? (
              <SandpackProvider
                template={projectFramework === 'html' ? 'static' : 'react'}
                files={projectFiles}
                options={{ recompileMode: 'delayed', recompileDelay: 500 }}
              >
                <SandpackPreview
                  className="h-full w-full"
                  showOpenInCodeSandbox={false}
                  showRefreshButton
                />
              </SandpackProvider>
            ) : (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center opacity-20">
                <Globe className="w-12 h-12 text-zinc-600 mb-3" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  Preview will appear here
                </p>
              </div>
            )}
          </div>

          {deployUrl && (
            <div className="border-t border-zinc-800 p-2 bg-zinc-900">
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 truncate block font-medium transition-colors"
              >
                🌐 {deployUrl}
              </a>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}
