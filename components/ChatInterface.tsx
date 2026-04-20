'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getModelById } from '@/lib/models';
import { Sidebar } from '@/components/Sidebar';
import { Header, AppTab } from '@/components/Header';
import { ChatView } from '@/components/ChatView';
import { AgentWorkspace } from '@/components/AgentWorkspace';
import { ToolView } from './ToolView';
import ConnectorsPage, { getConnectorTokens } from '@/components/ConnectorsPage';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatResponse {
  modelId: string;
  text: string;
  status: 'busy' | 'success' | 'failed';
  type?: string;
  toolName?: string;
  toolKey?: string;
  data?: any;
  error?: string;
}

export interface ChatTurn {
  userMessage: string;
  responses: ChatResponse[];
}

type AgentStep = 'idle' | 'thinking' | 'planning' | 'generating' | 'building';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatInterface({
  initialChatId,
  initialMessages = [],
  initialProjectFiles = null,
  initialProjectFramework = 'react',
}: {
  initialChatId?: string;
  initialMessages?: ChatTurn[];
  initialProjectFiles?: Record<string, string> | null;
  initialProjectFramework?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  // ── Core State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AppTab>(
    initialProjectFiles ? 'agent' : 'chat'
  );
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(initialChatId);

  // ── Model State ──────────────────────────────────────────────────────────────
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(['gpt-4o-mini']);
  // preferredModel: saved when user clicks "Prefer this" in Compare mode
  const [preferredModel, setPreferredModel] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  // 'best'    → single model, clean ChatGPT-like UX
  // 'compare' → all selected models in parallel, grid layout
  const [viewMode, setViewMode] = useState<'best' | 'compare'>('best');
  const [enabledConnectorIds, setEnabledConnectorIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['web'];
    try { return JSON.parse(localStorage.getItem('universe_ai_enabled_connectors') || '["web"]'); } catch { return ['web']; }
  });

  // Sync toggles to localStorage
  useEffect(() => {
    localStorage.setItem('universe_ai_enabled_connectors', JSON.stringify(enabledConnectorIds));
  }, [enabledConnectorIds]);

  const handleToggleConnector = (id: string) => {
    setEnabledConnectorIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Agent / IDE State ─────────────────────────────────────────────────────────
  const [projectFiles, setProjectFiles] = useState<Record<string, string> | null>(initialProjectFiles);
  const [projectFramework, setProjectFramework] = useState(initialProjectFramework);
  const [agentStep, setAgentStep] = useState<AgentStep>('idle');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null!);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (userId) fetchUserStatus();
  }, [(session?.user as any)?.id]);

  useEffect(() => {
    if (activeTab !== 'agent') setAgentStep('idle');
  }, [activeTab]);

  // ── Fetchers ──────────────────────────────────────────────────────────────────
  const fetchUserStatus = async () => {
    try {
      const res = await fetch('/api/user/status');
      if (res.ok) {
        const data = await res.json();
        setIsPremium(data.isPremium ?? false);
      }
    } catch {}
  };

  // ── Model Toggle — max 3 ─────────────────────────────────────────────────────
  const toggleModel = useCallback((id: string) => {
    setSelectedModelIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1
        // if we're deselecting the preferred model, clear it
        if (preferredModel === id) setPreferredModel(null);
        return prev.filter(m => m !== id);
      }
      if (prev.length >= 3) return [...prev.slice(1), id]; // drop oldest
      return [...prev, id];
    });
  }, [preferredModel]);

  // ── Prefer Model ─────────────────────────────────────────────────────────────
  const handlePreferModel = useCallback((modelId: string) => {
    setPreferredModel(modelId);
    setViewMode('best'); // automatically switch to Best mode
  }, []);

  // ── New Chat ──────────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setChatHistory([]);
    setActiveChatId(undefined);
    setProjectFiles(null);
    setDeployUrl(null);
    setAgentStep('idle');
    setInput('');
    setActiveTab('chat');
    window.history.pushState(null, '', '/app');
  }, []);

  // ── Message Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setIsLoading(true);

    const isToolTab = activeTab === 'docs' || activeTab === 'jobs';
    const isAgentMode = activeTab === 'agent';
    const isCompareMode = !isToolTab && !isAgentMode && viewMode === 'compare' && selectedModelIds.length > 1;
    const activeModels = isCompareMode ? selectedModelIds : [preferredModel || selectedModelIds[0] || 'ai'];

    // Whether to use streaming (only for standard chat, not tools/agent)
    const useStreaming = !isToolTab && !isAgentMode;

    // Optimistic placeholders
    const optimisticTurn: ChatTurn = {
      userMessage: msg,
      responses: isAgentMode
        ? [{ modelId: 'gemini-agent', text: '', status: 'busy' }]
        : isToolTab
        ? [{ modelId: activeTab, text: '', status: 'busy', type: 'tool', toolKey: activeTab }]
        : activeModels.map(id => ({ modelId: id, text: '', status: 'busy' as const })),
    };
    setChatHistory(prev => [...prev, optimisticTurn]);

    const requestBody = {
      messages: [
        ...chatHistory.flatMap(m => [
          { role: 'user', content: m.userMessage },
          ...(m.responses.filter(r => r.status === 'success').slice(0, 1)
            .map(r => ({ role: 'assistant', content: r.text }))),
        ]),
        { role: 'user', content: msg },
      ],
      chatId: activeChatId,
      selectedModels: selectedModelIds,
      preferredModel,
      mode: isAgentMode ? 'agent' : 'chat',
      viewMode: isToolTab ? 'best' : viewMode,
      connectorTokens: getConnectorTokens(),
      enabledConnectorIds,
    };

    try {
      if (useStreaming) {
        // ── Streaming path ────────────────────────────────────────────────
        await handleStreamingChat(requestBody, activeModels);
      } else {
        // ── Legacy JSON path (agent + tools) ──────────────────────────────
        await handleJsonChat(requestBody);
      }
    } catch (err) {
      console.error('[ChatInterface]', err);
      setChatHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) {
          last.responses = last.responses.map(r => ({
            ...r,
            status: 'failed' as const,
            text: '⚠️ Connection error. Please try again.',
          }));
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      if (activeTab !== 'agent' || agentStep !== 'building') setAgentStep('idle');
    }
  };

  // ── Streaming Chat Handler ─────────────────────────────────────────────────
  const handleStreamingChat = async (requestBody: any, activeModels: string[]) => {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      // If streaming endpoint fails, check if it returned JSON (tool result)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // Tool results come back as JSON — handle them
        if (data.results) {
          handleJsonResponse(data);
          return;
        }
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';

    // If the stream route returned JSON (tool results), handle it
    if (contentType.includes('application/json')) {
      const data = await res.json();
      handleJsonResponse(data);
      return;
    }

    // ── SSE stream reading ──────────────────────────────────────────────
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Accumulate text per model for final state
    const modelTexts: Record<string, string> = {};
    activeModels.forEach(id => { modelTexts[id] = ''; });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event: ')) {
          // Parse SSE event
          const eventType = trimmed.slice(7);
          // Next line should be data
          continue;
        }

        if (trimmed.startsWith('data: ')) {
          const raw = trimmed.slice(6);
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          // Determine event type from parsed data structure
          if (parsed.delta !== undefined && parsed.modelKey) {
            // ── chunk event: append delta to the correct model ──────
            const key = parsed.modelKey;
            modelTexts[key] = (modelTexts[key] || '') + parsed.delta;
            const currentText = modelTexts[key];

            setChatHistory(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (!last) return prev;

              const respIdx = last.responses.findIndex(r => r.modelId === key);
              if (respIdx !== -1) {
                const newResponses = [...last.responses];
                newResponses[respIdx] = {
                  ...newResponses[respIdx],
                  text: currentText,
                  status: 'busy',
                };
                return [...updated.slice(0, -1), { ...last, responses: newResponses }];
              }
              return prev;
            });

          } else if (parsed.fullText !== undefined && parsed.modelKey) {
            // ── model_done event: finalize this model's response ─────
            const key = parsed.modelKey;
            modelTexts[key] = parsed.fullText;

            setChatHistory(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (!last) return prev;

              const respIdx = last.responses.findIndex(r => r.modelId === key);
              if (respIdx !== -1) {
                const newResponses = [...last.responses];
                newResponses[respIdx] = {
                  ...newResponses[respIdx],
                  text: parsed.fullText,
                  status: 'success',
                };
                return [...updated.slice(0, -1), { ...last, responses: newResponses }];
              }
              return prev;
            });

          } else if (parsed.error && parsed.modelKey) {
            // ── error event for specific model ──────────────────────
            const key = parsed.modelKey;
            setChatHistory(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (!last) return prev;

              const respIdx = last.responses.findIndex(r => r.modelId === key);
              if (respIdx !== -1) {
                const newResponses = [...last.responses];
                newResponses[respIdx] = {
                  ...newResponses[respIdx],
                  text: '⚠️ Model failed to respond.',
                  status: 'failed',
                  error: parsed.error,
                };
                return [...updated.slice(0, -1), { ...last, responses: newResponses }];
              }
              return prev;
            });

          } else if (parsed.chatId && !parsed.delta && !parsed.fullText && !parsed.error) {
            // ── meta event: chatId ──────────────────────────────────
            if (!activeChatId && parsed.chatId) {
              setActiveChatId(parsed.chatId);
              window.history.pushState(null, '', `/chat/${parsed.chatId}`);
            }
          }
          // 'done' event — stream finished, nothing special to do
        }
      }
    }
  };

  // ── JSON Chat Handler (Agent + Tools) ──────────────────────────────────────
  const handleJsonChat = async (requestBody: any) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    handleJsonResponse(data);
  };

  // ── Shared JSON response handler ──────────────────────────────────────────
  const handleJsonResponse = (data: any) => {
    if (!activeChatId && data.chatId) {
      setActiveChatId(data.chatId);
      window.history.pushState(null, '', `/chat/${data.chatId}`);
    }

    const newResponses: ChatResponse[] = (data.results || []).map((r: any) => ({
      modelId: r.id || r.modelId || 'ai',
      text: r.text || '',
      status: (r.status as 'success' | 'failed') || 'success',
      type: r.type || 'llm',
      toolName: r.toolName,
      toolKey: r.toolKey,
      data: r.data,
      error: r.error,
    }));

    setChatHistory(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        last.responses = newResponses.length > 0
          ? newResponses
          : [{ modelId: selectedModelIds[0], text: '⚠️ Model failed to respond.', status: 'failed' }];
      }
      return updated;
    });

    // Handle project files from agent
    const agentResult = (data.results || []).find((r: any) => r.project?.files);
    if (agentResult?.project?.files) {
      setProjectFiles(agentResult.project.files);
      setProjectFramework(agentResult.project.framework || 'react');
      if (activeTab !== 'agent') setActiveTab('agent');
      setAgentStep('building');
    }
  };

  // ── Deploy ────────────────────────────────────────────────────────────────────
  const handleDeploy = async () => {
    if (!projectFiles || isDeploying) return;
    setIsDeploying(true);
    setDeployUrl(null);
    try {
      const res = await fetch('/api/plugins/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: projectFiles, framework: projectFramework, projectName: activeChatId || 'Project' }),
      });
      const data = await res.json();
      if (data.url) setDeployUrl(data.url);
    } catch {
    } finally {
      setIsDeploying(false);
    }
  };

  // ── Edit & Resubmit ───────────────────────────────────────────────────────────
  const handleEditSubmit = (turnIndex: number, newMessage: string) => {
    setChatHistory(prev => prev.slice(0, turnIndex));
    setInput(newMessage);
    setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 50);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50">

      {/* ── Sidebar wrapper — controls width only, no position:fixed ───────── */}
      <div className={clsx(
        'flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[60px]' : 'w-64'
      )}>
        <Sidebar
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* ── Main content — flex-1 auto-fills remaining space, NO margin ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedModelIds={selectedModelIds}
          onToggleModel={toggleModel}
          isPremium={isPremium}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          preferredModel={preferredModel}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
          activeConnectorIds={Object.keys(getConnectorTokens())}
        />

        {activeTab === 'chat' && (
          <ChatView
            chatHistory={chatHistory}
            input={input}
            isLoading={isLoading}
            onInputChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            onEditSubmit={handleEditSubmit}
            selectedModelIds={selectedModelIds}
            viewMode={viewMode}
            preferredModel={preferredModel}
            onPreferModel={handlePreferModel}
            onViewModeChange={setViewMode}
            enabledConnectorIds={enabledConnectorIds}
            onToggleConnector={handleToggleConnector}
            onOpenConnectors={() => setActiveTab('connectors')}
          />
        )}

        {activeTab === 'agent' && (
          <AgentWorkspace
            chatHistory={chatHistory}
            input={input}
            isLoading={isLoading}
            agentStep={agentStep}
            projectFiles={projectFiles}
            projectFramework={projectFramework}
            onInputChange={e => setInput(e.target.value)}
            onSubmit={handleSubmit}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            deployUrl={deployUrl}
            messagesEndRef={messagesEndRef}
          />
        )}

        {activeTab === 'connectors' && (
          <ConnectorsPage />
        )}

        {(activeTab === 'docs' || activeTab === 'jobs') && (
          <ToolView
            toolKey={activeTab === 'docs' ? 'pdf_reader' : 'job_search'}
            chatHistory={chatHistory}
            input={input}
            isLoading={isLoading}
            onInputChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
