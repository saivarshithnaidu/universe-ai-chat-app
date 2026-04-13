'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Lock, ChevronDown, Cpu, Star,
  BarChart2, Plug, Sparkles, FileText, Briefcase, PanelLeft
} from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import clsx from 'clsx';

// ─── Tab Config ───────────────────────────────────────────────────────────────

export type AppTab = 'chat' | 'agent' | 'connectors' | 'docs' | 'jobs';

export const TABS: { id: AppTab; name: string; icon: React.ElementType; color: string }[] = [
  { id: 'chat',       name: 'Chat',       icon: MessageSquare, color: 'text-blue-400'   },
  { id: 'agent',      name: 'AI Agent',   icon: Cpu,           color: 'text-cyan-400'   },
  { id: 'connectors', name: 'Connectors', icon: Plug,          color: 'text-violet-400' },
  { id: 'docs',       name: 'Docs',       icon: FileText,      color: 'text-orange-400' },
  { id: 'jobs',       name: 'Jobs',       icon: Briefcase,     color: 'text-pink-400'   },
];

// Keep backwards-compat exports
export const CORE_TABS = TABS;
export const TOOL_TABS: typeof TABS = [];

const MAX_MODELS = 3;

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  selectedModelIds: string[];
  onToggleModel: (id: string) => void;
  isPremium: boolean;
  viewMode: 'best' | 'compare';
  onViewModeChange: (mode: 'best' | 'compare') => void;
  preferredModel?: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeConnectorIds: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({
  activeTab,
  onTabChange,
  selectedModelIds,
  onToggleModel,
  isPremium,
  viewMode,
  onViewModeChange,
  preferredModel,
  sidebarCollapsed,
  onToggleSidebar,
  activeConnectorIds,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAgentTab = activeTab === 'agent';
  const isConnectorsTab = activeTab === 'connectors';
  const showModelPicker = activeTab === 'chat';
  const selectedCount = selectedModelIds.length;
  const primaryModel = AVAILABLE_MODELS.find(m => m.id === (preferredModel || selectedModelIds[0]));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-zinc-950 border-b border-zinc-800/60 z-20 flex-shrink-0 gap-4">

      {/* ── LEFT: Toggle + Logo ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sidebar toggle — always hittable */}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all duration-200 flex-shrink-0"
        >
          <PanelLeft className={clsx('w-4 h-4 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} />
        </button>
        {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 border border-white/20 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-black text-sm">U</span>
        </div>
        <span className="text-lg font-black tracking-tight text-white select-none">
          Universe<span className="text-blue-400">AI</span>
        </span>
      </div>
      </div>

      {/* ── CENTER: Tab Pill Nav ─────────────────────────────────────────── */}
      <nav id="main-tabs" className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-1 gap-0.5 flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              <Icon className={clsx('w-3.5 h-3.5', isActive ? 'text-white' : tab.color)} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ── RIGHT: Controls ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Agent tab: Gemini badge */}
        {isAgentTab && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300">Gemini 2.0</span>
          </div>
        )}

        {/* Connectors tab: pill badge */}
        {isConnectorsTab && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-xl">
            <Plug className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Connectors Platform</span>
          </div>
        )}

        {/* Chat tab: mode toggle + model picker */}
        {showModelPicker && (
          <>
            {/* Active Connectors Indicator */}
            {activeConnectorIds.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mr-1 ml-1">Tools:</span>
                <div className="flex -space-x-1.5">
                  {activeConnectorIds.slice(0, 4).map(id => {
                    const iconMap: Record<string, string> = {
                      web: 'https://www.vectorlogo.zone/logos/google/google-icon.svg',
                      gmail: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
                      notion: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
                      supabase: 'https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg',
                      github: 'https://www.vectorlogo.zone/logos/github/github-icon.svg',
                    };
                    return (
                      <div key={id} className="w-5 h-5 rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center p-1 shadow-sm overflow-hidden" title={`${id} enabled`}>
                        <img src={iconMap[id] || ''} className="w-full h-full object-contain" alt={id} />
                      </div>
                    );
                  })}
                  {activeConnectorIds.length > 4 && (
                    <div className="w-5 h-5 rounded-md border border-zinc-800 bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                      +{activeConnectorIds.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Best / Compare Toggle */}
            <div
              id="mode-toggle"
              className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 gap-0.5"
            >
              <button
                id="view-best-btn"
                onClick={() => onViewModeChange('best')}
                title="Best Answer — use one model, clean chat"
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200',
                  viewMode === 'best'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Star className="w-3 h-3" />
                <span>Best</span>
              </button>
              <button
                id="view-compare-btn"
                onClick={() => onViewModeChange('compare')}
                title="Compare — all selected models respond"
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200',
                  viewMode === 'compare'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Compare</span>
              </button>
            </div>

            {/* Model Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="model-selector-btn"
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-200 min-w-[130px]"
              >
                <ProviderDot provider={primaryModel?.provider || 'OpenAI'} />
                <span className="flex-1 text-left truncate">
                  {selectedCount === 0
                    ? 'Select model'
                    : selectedCount === 1
                    ? (primaryModel?.name || selectedModelIds[0])
                    : `${selectedCount} Models`}
                </span>
                <ChevronDown className={clsx('w-3.5 h-3.5 text-zinc-500 transition-transform', dropdownOpen && 'rotate-180')} />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ width: '300px' }}
                >
                  {/* Panel Header */}
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-white">Select Models</p>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={clsx('w-2 h-2 rounded-full transition-all', i < selectedCount ? 'bg-blue-500' : 'bg-zinc-800')} />
                        ))}
                      </div>
                    </div>
                    {selectedCount > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedModelIds.map(id => {
                          const m = AVAILABLE_MODELS.find(x => x.id === id);
                          const isPreferred = preferredModel === id;
                          return (
                            <span
                              key={id}
                              className={clsx(
                                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                isPreferred
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              )}
                            >
                              {isPreferred && <Star className="w-2.5 h-2.5" />}
                              {m?.name || id}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-2">
                      {viewMode === 'best'
                        ? `Best mode — only ${primaryModel?.name || 'first model'} will respond`
                        : `Compare mode — all ${selectedCount} models respond in parallel`}
                    </p>
                  </div>

                  {/* Model List */}
                  <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {AVAILABLE_MODELS.map(model => {
                      const isSelected = selectedModelIds.includes(model.id);
                      const isLocked = !isPremium && !!model.isPremium;
                      const selIdx = selectedModelIds.indexOf(model.id);
                      const atLimit = !isSelected && selectedCount >= MAX_MODELS;
                      const isPreferred = preferredModel === model.id;

                      return (
                        <button
                          key={model.id}
                          id={`model-option-${model.id}`}
                          onClick={() => { if (!isLocked && !atLimit) onToggleModel(model.id); }}
                          disabled={isLocked || atLimit}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 mb-0.5',
                            isSelected ? 'bg-zinc-800 text-white'
                            : isLocked || atLimit ? 'text-zinc-600 cursor-not-allowed'
                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                          )}
                        >
                          <ProviderDot provider={model.provider} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold truncate">{model.name}</span>
                              {model.isPremium && (
                                <span className="text-[9px] font-bold text-amber-400 border border-amber-400/30 rounded px-1 py-0.5 uppercase flex-shrink-0">Pro</span>
                              )}
                              {isPreferred && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 flex-shrink-0">
                                  <Star className="w-2.5 h-2.5" /> Preferred
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-600 truncate">{model.description}</p>
                          </div>
                          {isLocked && <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
                          {isSelected && (
                            <div className={clsx(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0',
                              selIdx === 0 ? 'bg-blue-500 text-white' :
                              selIdx === 1 ? 'bg-violet-500 text-white' :
                              'bg-zinc-600 text-white'
                            )}>
                              {selIdx + 1}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
                    <p className="text-[10px] text-zinc-600 font-medium">
                      {viewMode === 'compare'
                        ? <> All models run in <span className="text-blue-400 font-bold">parallel</span> — switch to Best for a focused response.</>
                        : <> Switch to <span className="text-blue-400 font-bold">Compare</span> to see all models answer.</>
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ─── Provider Color Dot ───────────────────────────────────────────────────────

function ProviderDot({ provider }: { provider: string }) {
  const colorMap: Record<string, string> = {
    OpenAI:    'bg-green-400',
    Google:    'bg-blue-400',
    Anthropic: 'bg-orange-400',
    DeepSeek:  'bg-purple-400',
    Meta:      'bg-cyan-400',
    Mistral:   'bg-yellow-400',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[provider] || 'bg-zinc-500'}`} />;
}
