'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Plus, MessageSquare, SquarePen, LogOut, User, ChevronRight,
  Zap, MoreHorizontal, Pencil, Trash2, Share2
} from 'lucide-react';
import clsx from 'clsx';

interface ChatEntry {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  activeChatId?: string;
  onNewChat: () => void;
  collapsed: boolean;           // ← driven by parent, no internal state
}

export function Sidebar({ activeChatId, onNewChat, collapsed }: SidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => { fetchChats(); }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data.map((c: any) => ({
          id: c.id,
          title: c.title || 'Untitled Chat',
          createdAt: c.created_at,
        })));
      }
    } catch {}
  };

  const handleDelete = async (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    try { await fetch(`/api/chats/${chatId}`, { method: 'DELETE' }); } catch {}
    if (activeChatId === chatId) router.push('/app');
  };

  const handleRename = async (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch {}
  };

  const now = new Date();
  const groups = [
    { label: 'Today',     chats: chats.filter(c => now.getTime() - new Date(c.createdAt).getTime() < 86400000) },
    { label: 'Yesterday', chats: chats.filter(c => { const ms = now.getTime() - new Date(c.createdAt).getTime(); return ms >= 86400000 && ms < 172800000; }) },
    { label: 'Previous',  chats: chats.filter(c => now.getTime() - new Date(c.createdAt).getTime() >= 172800000) },
  ].filter(g => g.chats.length > 0);

  const user = session?.user;

  // ── The aside itself NEVER positions absolute/fixed ───────────────────────
  // Width is controlled by the parent flex container via the `collapsed` prop.
  return (
    <aside className="h-full bg-zinc-950 border-r border-zinc-800/60 flex flex-col overflow-hidden">

      {/* ── New Chat Button ──────────────────────────────────────────────── */}
      <div className={clsx(
        'p-3 border-b border-zinc-800/60 flex flex-col gap-2',
        collapsed ? 'items-center' : ''
      )}>
        <button
          id="new-chat-btn"
          onClick={onNewChat}
          title="New Chat"
          className={clsx(
            'flex items-center gap-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all duration-200 text-zinc-300 hover:text-white group',
            collapsed ? 'w-9 h-9 justify-center p-0' : 'w-full px-3 py-2'
          )}
        >
          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm font-medium">New Chat</span>
              <SquarePen className="w-3.5 h-3.5 ml-auto text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </>
          )}
        </button>
      </div>

      {/* ── Chat History ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {chats.length === 0 ? (
          !collapsed && (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600 font-medium">No conversations yet</p>
            </div>
          )
        ) : collapsed ? (
          /* Collapsed: icon-only dots */
          <div className="px-2 flex flex-col items-center gap-1 pt-1">
            {chats.slice(0, 14).map(chat => (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                title={chat.title}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800',
                  activeChatId === chat.id && 'bg-zinc-800 text-zinc-300'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        ) : (
          <>
            {groups.map(group => (
              <div key={group.label} className="px-3 mb-2">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 py-1">
                  {group.label}
                </p>
                {group.chats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    onClick={() => router.push(`/chat/${chat.id}`)}
                    onDelete={() => handleDelete(chat.id)}
                    onRename={(title) => handleRename(chat.id, title)}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── User Profile ─────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-800/60 p-3 flex-shrink-0">
        <div className="relative">
          <button
            id="user-profile-btn"
            onClick={() => setIsUserMenuOpen(v => !v)}
            className={clsx(
              'flex items-center gap-3 rounded-lg hover:bg-zinc-800/60 transition-all duration-200 group',
              collapsed ? 'w-9 h-9 justify-center p-0' : 'w-full px-2 py-2'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
              {user?.image
                ? <img src={user.image} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
                : <User className="w-3.5 h-3.5" />}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-zinc-500 truncate leading-tight">{user?.email || ''}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
              </>
            )}
          </button>

          {isUserMenuOpen && (
            <div className={clsx(
              'absolute bottom-full mb-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50',
              collapsed ? 'left-full ml-2 bottom-0 mb-0' : 'left-0'
            )}>
              <div className="p-1.5 border-b border-zinc-800">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Plan</p>
                    <p className="text-xs text-blue-400 font-semibold">Standard</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  id="sign-out-btn"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Chat Item with 3-dot menu ────────────────────────────────────────────────

function ChatItem({
  chat, isActive, onClick, onDelete, onRename,
}: {
  chat: ChatEntry;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) onRename(trimmed);
    setIsRenaming(false);
  };

  return (
    <div className={clsx(
      'relative flex items-center rounded-lg transition-all duration-150 group',
      isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900'
    )}>
      {isRenaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setRenameValue(chat.title); setIsRenaming(false); }
          }}
          className="flex-1 bg-transparent text-xs font-medium text-white px-2 py-2 outline-none border border-blue-500/50 rounded-lg m-0.5"
        />
      ) : (
        <button onClick={onClick} className="flex-1 flex items-center gap-2 px-2 py-2 text-left min-w-0">
          <MessageSquare className={clsx('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-zinc-400' : 'text-zinc-600')} />
          <span className={clsx('text-xs font-medium truncate', isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300')}>
            {chat.title}
          </span>
        </button>
      )}

      {!isRenaming && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            id={`chat-menu-${chat.id}`}
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className={clsx(
              'w-6 h-6 mr-1 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all duration-150',
              'opacity-0 group-hover:opacity-100',
              menuOpen && 'opacity-100 bg-zinc-700 text-zinc-300'
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-1">
                <button onClick={() => { setIsRenaming(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                  <Pencil className="w-3.5 h-3.5" /> Rename
                </button>
                <button onClick={() => { navigator.share?.({ title: chat.title, url: `/chat/${chat.id}` }); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <hr className="border-zinc-800 my-1" />
                <button onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
