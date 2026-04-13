'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Key, ExternalLink, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface ConnectToolModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool: { id: string; name: string; description: string; icon: any; color: string } | null;
    onSuccess: () => void;
}

export function ConnectToolModal({ isOpen, onClose, tool, onSuccess }: ConnectToolModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [connectedAt, setConnectedAt] = useState<string | null>(null);

    // Task 4: On page load/open, call /status API
    useEffect(() => {
        if (isOpen && tool?.id === 'resume_builder') {
            checkConnectionStatus();
        } else {
            setIsConnected(false);
            setConnectedAt(null);
        }
    }, [isOpen, tool?.id]);

    const checkConnectionStatus = async () => {
        try {
            const res = await fetch('/api/plugins/resume/status');
            if (res.ok) {
                const data = await res.json();
                setIsConnected(data.connected);
                if (data.connectedAt) setConnectedAt(data.connectedAt);
            }
        } catch (e) {
            console.error("Status check failed", e);
        }
    };

    if (!isOpen || !tool) return null;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            // Task 1: Use specific backend API for ResumeForgeAI
            const endpoint = tool.id === 'resume_builder' 
                ? '/api/plugins/resume/connect' 
                : '/api/tools/connect';

            const payload = tool.id === 'resume_builder'
                ? { apiKey: apiKey.trim() }
                : { toolKey: tool.id, apiKey: apiKey.trim(), action: 'connect' };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                // Task 6: Ensure persistence after refresh
                if (tool.id === 'resume_builder') {
                    setIsConnected(true);
                    setApiKey('');
                    checkConnectionStatus();
                } else {
                    onClose();
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to connect plugin.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className={clsx("p-2 rounded-lg bg-white/5", tool.color)}>
                            <tool.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Connect {tool.name}</h3>
                            <p className="text-xs text-zinc-500">External Plugin Integration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 flex gap-3">
                        <Shield className="w-5 h-5 text-blue-400 shrink-0" />
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Your API Key is encrypted both in transit and at rest. 
                            UniversalAI performs tool calls server-side for maximum security.
                        </p>
                    </div>

                    {/* Task 4 & 7: Conditional rendering based on connection status */}
                    {isConnected ? (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in zoom-in-95">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Successfully Connected</h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {tool.name} is ready to use in your chats.
                                    {connectedAt && <span className="block mt-1">Linked on {new Date(connectedAt).toLocaleDateString()}</span>}
                                </p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="mt-2 text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                            >
                                Close Modal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleConnect} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-1">
                                    {tool.name} API Key
                                </label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-[#1C1C1C] border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group-hover:border-white/10"
                                        required
                                    />
                                    <Key className="absolute right-4 top-3.5 w-4 h-4 text-zinc-600" />
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-500 px-1">{error}</p>}

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {isLoading ? 'Connecting...' : 'Secure Connection'}
                                </button>
                                <a 
                                    href={`https://universalai.app/docs/tools/${tool.id}`} 
                                    target="_blank" 
                                    className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                                >
                                    Get your {tool.name} key <ExternalLink size={12} />
                                </a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
