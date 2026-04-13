'use client';

import { useState, useEffect } from 'react';
import {
  ExternalLink, Key, Eye, EyeOff, X, CheckCircle2,
  ChevronDown, Globe, Lock, Zap
} from 'lucide-react';
import {
  CONNECTOR_REGISTRY, getConnectorsByCategory, isConnectorConnected,
  type ConnectorDef, type ConnectorCategory, type AuthType
} from '@/lib/mcp/connectors';
import clsx from 'clsx';

// ─── Token Storage ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'universe_ai_connector_tokens';

export function loadTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveTokens(tokens: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getConnectorTokens(): Record<string, string> { return loadTokens(); }

// ─── Auth Type Badge ─────────────────────────────────────────────────────────

const AUTH_BADGE: Record<AuthType, { label: string; icon: React.ElementType; className: string }> = {
  oauth:  { label: 'OAuth',  icon: Globe, className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  token:  { label: 'Token',  icon: Key,   className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  public: { label: 'Public', icon: Zap,   className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const CAT_COLOR: Record<ConnectorCategory, string> = {
  'AI & Dev':           'text-blue-400',
  'Productivity':       'text-purple-400',
  'Job & Business':     'text-amber-400',
  'Design':             'text-pink-400',
  'Database & Storage': 'text-emerald-400',
  'Deployment':         'text-violet-400',
  'Automation':         'text-orange-400',
  'Analytics':          'text-cyan-400',
  'Auth':               'text-red-400',
  '3D & Visual':        'text-teal-400',
};

// ─── Connector Logo ───────────────────────────────────────────────────────────

function ConnectorLogo({ c }: { c: ConnectorDef }) {
  const isEmoji = !c.logo.startsWith('http');
  return (
    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {isEmoji
        ? <span className="text-lg leading-none">{c.logo}</span>
        : <img src={c.logo} alt={c.name} className="w-5 h-5 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      }
    </div>
  );
}

// ─── Token Modal (for 'token' authType) ──────────────────────────────────────

function TokenModal({ connector, onClose, onSave }: {
  connector: ConnectorDef;
  onClose: () => void;
  onSave: (token: string) => void;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ConnectorLogo c={connector} />
            <div>
              <h2 className="text-sm font-bold text-white">{connector.name}</h2>
              <p className="text-[10px] text-zinc-500">{connector.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
            <Key className="w-3 h-3" /> {connector.tokenLabel || 'API Key'}
          </label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={connector.tokenHint || 'Enter your API key…'}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 pr-9 font-mono transition-colors"
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {connector.docsUrl && (
          <a href={connector.docsUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-blue-400/80 hover:text-blue-400 mb-4 transition-colors">
            <ExternalLink className="w-3 h-3" /> View docs
          </a>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:text-zinc-300 transition-all">
            Cancel
          </button>
          <button
            disabled={!value.trim()}
            onClick={() => { onSave(value.trim()); onClose(); }}
            className="flex-1 py-2 text-xs font-bold bg-white text-zinc-950 rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Connector Row ────────────────────────────────────────────────────────────

function ConnectorRow({ c, tokens, onConnect, onOAuth, onDisconnect }: {
  c: ConnectorDef;
  tokens: Record<string, string>;
  onConnect: (c: ConnectorDef) => void;
  onOAuth:   (c: ConnectorDef) => void;
  onDisconnect: (id: string) => void;
}) {
  const connected = isConnectorConnected(c, tokens);
  const badge = AUTH_BADGE[c.authType];
  const BadgeIcon = badge.icon;

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150',
      connected
        ? 'bg-zinc-900/80 border-zinc-700/60 hover:border-zinc-600'
        : 'bg-zinc-900/30 border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/60'
    )}>
      <ConnectorLogo c={c} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-200">{c.name}</span>

          {/* Auth type badge */}
          <span className={clsx('inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border', badge.className)}>
            <BadgeIcon className="w-2.5 h-2.5" />
            {badge.label}
          </span>

          {/* Connected badge */}
          {connected && c.authType !== 'public' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Connected
            </span>
          )}
          {c.authType === 'public' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              Always On
            </span>
          )}
        </div>

        <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{c.description}</p>

        {/* Tools */}
        <div className="flex flex-wrap gap-1 mt-1">
          {c.tools.map(t => (
            <span key={t.id} className="text-[9px] font-medium text-zinc-600 bg-zinc-800/80 border border-zinc-700/40 px-1.5 py-0.5 rounded-full">
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Action Button ── */}
      {c.authType === 'public' ? (
        <div className="flex-shrink-0 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
        </div>
      ) : connected ? (
        <button
          onClick={() => onDisconnect(c.id)}
          className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg text-zinc-500 border border-zinc-700/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition-all">
          Disconnect
        </button>
      ) : c.authType === 'oauth' ? (
        <button
          onClick={() => onOAuth(c)}
          className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg text-blue-400 border border-blue-500/40 hover:bg-blue-500/10 transition-all">
          <Globe className="w-3 h-3" /> Connect via OAuth
        </button>
      ) : (
        <button
          onClick={() => onConnect(c)}
          className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg text-zinc-400 border border-zinc-700/60 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all">
          <Key className="w-3 h-3" /> Add Token
        </button>
      )}
    </div>
  );
}

// ─── Category Group ───────────────────────────────────────────────────────────

function CategoryGroup({ category, connectors, tokens, onConnect, onOAuth, onDisconnect }: {
  category: ConnectorCategory;
  connectors: ConnectorDef[];
  tokens: Record<string, string>;
  onConnect: (c: ConnectorDef) => void;
  onOAuth: (c: ConnectorDef) => void;
  onDisconnect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const connectedCount = connectors.filter(c => isConnectorConnected(c, tokens)).length;

  return (
    <div className="mb-6">
      <button onClick={() => setCollapsed(v => !v)} className="flex items-center gap-2 w-full text-left mb-3">
        <ChevronDown className={clsx('w-3.5 h-3.5 text-zinc-600 transition-transform', collapsed && '-rotate-90')} />
        <span className={clsx('text-[11px] font-bold uppercase tracking-widest', CAT_COLOR[category])}>{category}</span>
        <span className="text-[10px] text-zinc-700 font-medium">
          {connectors.length} connector{connectors.length !== 1 ? 's' : ''}
          {connectedCount > 0 && <span className="ml-1.5 text-emerald-600">· {connectedCount} connected</span>}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {connectors.map(c => (
            <ConnectorRow key={c.id} c={c} tokens={tokens}
              onConnect={onConnect} onOAuth={onOAuth} onDisconnect={onDisconnect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── OAuth Flow Modal ─────────────────────────────────────────────────────────
// Opens the real provider OAuth URL in a new tab.
// Since we can't receive a callback in demo, user confirms manually after auth.

function OAuthModal({ connector, onClose, onConnected }: {
  connector: ConnectorDef;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [step, setStep] = useState<'confirm' | 'waiting' | 'done'>('confirm');

  const handleAuthorize = () => {
    // Actually open the real OAuth URL
    const url = connector.oauthUrl || connector.docsUrl || '#';
    window.open(url, '_blank', 'noopener,noreferrer');
    setStep('waiting');
  };

  const handleMarkConnected = () => {
    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ConnectorLogo c={connector} />
            <div>
              <h2 className="text-sm font-bold text-white">{connector.name}</h2>
              <span className={clsx('inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5', AUTH_BADGE.oauth.className)}>
                <Globe className="w-2.5 h-2.5" /> OAuth 2.0
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Step 1: Confirm */}
        {step === 'confirm' && (
          <>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clicking <span className="text-white font-semibold">Authorize</span> will open{' '}
                <span className="text-blue-400 font-semibold">{connector.name}</span>'s login page in a new tab.
                After authorizing, come back here and confirm.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 text-xs font-semibold text-zinc-500 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:text-zinc-300 transition-all">
                Cancel
              </button>
              <button onClick={handleAuthorize} className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-1.5">
                <Globe className="w-3 h-3" /> Open {connector.name} →
              </button>
            </div>
          </>
        )}

        {/* Step 2: Waiting for user to authorize in the new tab */}
        {step === 'waiting' && (
          <>
            <div className="text-center py-2 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-white mb-1">
                Waiting for authorization…
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                A new tab was opened to <span className="text-blue-400">{connector.name}</span>.<br />
                Complete the login there, then click below.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 text-xs font-semibold text-zinc-600 border border-zinc-800 rounded-xl hover:text-zinc-400 transition-all">
                Cancel
              </button>
              <button onClick={handleMarkConnected} className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> I've Authorized
              </button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">Connected!</p>
            <p className="text-xs text-zinc-500 mb-4">
              {connector.name} is now connected to UniverseAI.
            </p>
            <button
              onClick={() => { onConnected(); onClose(); }}
              className="w-full py-2 text-xs font-bold bg-white text-zinc-950 rounded-xl hover:bg-zinc-100 transition-all">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [tokenModal, setTokenModal] = useState<ConnectorDef | null>(null);
  const [oauthModal, setOAuthModal] = useState<ConnectorDef | null>(null);

  useEffect(() => { setTokens(loadTokens()); }, []);

  const handleTokenSave = (c: ConnectorDef, token: string) => {
    const next = { ...tokens, [c.id]: token };
    setTokens(next); saveTokens(next);
  };

  const handleOAuthConnected = (c: ConnectorDef) => {
    // Store a placeholder to mark as "oauth connected"
    const next = { ...tokens, [c.id]: `oauth:${c.id}:${Date.now()}` };
    setTokens(next); saveTokens(next);
  };

  const handleDisconnect = (id: string) => {
    const next = { ...tokens }; delete next[id];
    setTokens(next); saveTokens(next);
  };

  const grouped = getConnectorsByCategory();
  const connectedCount = CONNECTOR_REGISTRY.filter(c => isConnectorConnected(c, tokens)).length;
  const total = CONNECTOR_REGISTRY.length;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">Connectors</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Connect your tools. AI uses them when you ask.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-2">
              {(['oauth', 'token', 'public'] as AuthType[]).map(type => {
                const b = AUTH_BADGE[type];
                const Icon = b.icon;
                return (
                  <span key={type} className={clsx('inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border', b.className)}>
                    <Icon className="w-2.5 h-2.5" /> {b.label}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {connectedCount}/{total}
            </div>
          </div>
        </div>
      </div>

      {/* Connector List */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        {(Object.entries(grouped) as [ConnectorCategory, ConnectorDef[]][]).map(([cat, cs]) => (
          <CategoryGroup
            key={cat} category={cat} connectors={cs} tokens={tokens}
            onConnect={setTokenModal}
            onOAuth={setOAuthModal}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {/* Modals */}
      {tokenModal && (
        <TokenModal
          connector={tokenModal}
          onClose={() => setTokenModal(null)}
          onSave={token => handleTokenSave(tokenModal, token)}
        />
      )}
      {oauthModal && (
        <OAuthModal
          connector={oauthModal}
          onClose={() => setOAuthModal(null)}
          onConnected={() => handleOAuthConnected(oauthModal)}
        />
      )}
    </div>
  );
}
