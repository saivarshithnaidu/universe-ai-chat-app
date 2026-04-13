'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';
import { CONNECTOR_REGISTRY, isConnectorConnected } from '@/lib/mcp/connectors';
import { loadTokens } from './ConnectorsPage';
import clsx from 'clsx';

interface ConnectorsToggleMenuProps {
  enabledConnectorIds: string[];
  onToggle: (id: string) => void;
  onOpenSettings: () => void;
}

export function ConnectorsToggleMenu({
  enabledConnectorIds,
  onToggle,
  onOpenSettings,
}: ConnectorsToggleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [isOpen]);

  const tokens = loadTokens();
  // Show connectors that are either connected (token/oauth) or always-on (public)
  const connected = CONNECTOR_REGISTRY.filter(c => isConnectorConnected(c, tokens));
  const activeCount = (enabledConnectorIds || []).filter(id => {
    const c = CONNECTOR_REGISTRY.find(x => x.id === id);
    return c ? isConnectorConnected(c, tokens) : false;
  }).length;

  return (
    <div className="relative" ref={menuRef}>
      {/* + Button */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className={clsx(
          'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 border',
          isOpen
            ? 'bg-white text-zinc-950 border-white shadow-lg'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-zinc-800'
        )}
      >
        <Plus className={clsx('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-45')} />
        {/* Active badge */}
        {activeCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100]">
          <div className="p-3 border-b border-zinc-800/60 bg-zinc-900/50">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tools & Connectors</p>
          </div>

          <div className="py-2 px-1 max-h-64 overflow-y-auto custom-scrollbar">
            {connected.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-zinc-600">No connectors connected yet.</p>
                <button
                  onClick={() => { setIsOpen(false); onOpenSettings(); }}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Connect one →
                </button>
              </div>
            ) : (
              connected.map((c) => {
                const isEnabled = enabledConnectorIds.includes(c.id);
                const isEmoji = !c.logo.startsWith('http');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle(c.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden">
                        {isEmoji
                          ? <span className="text-xs">{c.logo}</span>
                          // eslint-disable-next-line @next/next/no-img-element
                          : <img src={c.logo} alt={c.name} className="w-4 h-4 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        }
                      </div>
                      <span className={clsx('text-xs font-semibold', isEnabled ? 'text-white' : 'text-zinc-500')}>
                        {c.name}
                      </span>
                    </div>
                    {/* Toggle pill */}
                    <div className={clsx(
                      'w-7 h-4 rounded-full p-0.5 transition-colors duration-200',
                      isEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                    )}>
                      <div className={clsx(
                        'w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200',
                        isEnabled ? 'translate-x-3' : 'translate-x-0'
                      )} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-zinc-800/60">
            <button
              onClick={() => { setIsOpen(false); onOpenSettings(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800/50"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage Connectors
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
