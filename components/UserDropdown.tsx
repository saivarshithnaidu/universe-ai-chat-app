'use client';

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export function UserDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20 overflow-hidden border border-white/10">
          {session.user.image ? (
            <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
          ) : (
            <User size={16} />
          )}
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-sm font-medium text-white truncate">{session.user.name || "User"}</p>
          <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 border-b border-white/5">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Zap size={16} />
                </div>
                <div>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Plan</p>
                   <p className="text-xs text-blue-400 font-bold">Standard</p>
                </div>
              </div>
          </div>
          <div className="p-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
