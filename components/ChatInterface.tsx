'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AVAILABLE_MODELS, getModelById, AIModel } from '@/lib/models';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { ChevronLeft, Menu, MessageSquare, Plus, Trash2, X, PanelLeftClose, PanelLeft, Settings, LogOut, SquarePen, Sparkles } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import clsx from 'clsx';
import { db, Chat, Message } from '@/lib/db';

interface ChatClient {
    id: string;
    title: string;
    created_at: string;
}

interface ChatTurn {
    userMessage: string;
    responses: {
        modelId: string;
        text: string;
        status: 'success' | 'failed' | 'busy';
        error?: string;
        note?: string;
    }[];
}

// Helper to rebuild history for API context
const buildModelHistory = (modelId: string, history: ChatTurn[], currentMessage: string) => {
    const messages = [];
    history.forEach(turn => {
        messages.push({ role: 'user', content: turn.userMessage });
        const response = turn.responses.find(r => r.modelId === modelId);
        if (response && response.text) {
            messages.push({ role: 'assistant', content: response.text });
        }
    });
    messages.push({ role: 'user', content: currentMessage });
    return messages;
};

export function ChatInterface() {
    const router = useRouter();
    const { userId } = useAuth();
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // User State
    const [isPremium, setIsPremium] = useState(false);
    const [premiumTrialUsed, setPremiumTrialUsed] = useState(0);
    const TRIAL_LIMIT = 5;

    // Custom chat state
    const [chats, setChats] = useState<ChatClient[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [input, setInput] = useState('');

    // Scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!isLoading) {
            scrollToBottom();
        }
    }, [chatHistory, isLoading]);

    // Check Mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch User Status
    const fetchUserStatus = async () => {
        try {
            const res = await fetch('/api/user');
            if (res.ok) {
                const data = await res.json();
                setIsPremium(data.isPremium);
                setPremiumTrialUsed(data.premiumTrialUsed);
            }
        } catch (e) {
            console.error("Failed to fetch user status", e);
        }
    };

    // Initial user fetch
    useEffect(() => {
        if (userId) {
            fetchUserStatus();
        }
    }, [userId]);

    // Check configuration
    useEffect(() => {
        fetch('/api/health')
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    console.error('Health Check Failed:', data);
                    throw new Error(data.message || 'Health check failed');
                }
                setIsConfigured(true);
            })
            .catch(err => {
                console.error('Health check failed', err);
                setIsConfigured(false);
            });
    }, []);

    // Load selection and sidebar state
    useEffect(() => {
        // Models
        const savedModels = localStorage.getItem('selectedModelIds');
        if (savedModels) {
            try {
                const parsed = JSON.parse(savedModels);
                if (Array.isArray(parsed)) {
                    const validIds = parsed.filter(id =>
                        AVAILABLE_MODELS.some((m: AIModel) => m.id === id)
                    );
                    setSelectedModelIds(validIds);
                }
            } catch (error) {
                console.error('Failed to load selected models:', error);
            }
        }

        // Sidebar prefs (only desktop)
        if (window.innerWidth >= 768) {
            const savedSidebar = localStorage.getItem('isSidebarOpen');
            if (savedSidebar !== null) {
                setIsSidebarOpen(savedSidebar === 'true');
            }
        }

        setIsLoaded(true);
    }, []);

    // Load chats on mount/auth
    useEffect(() => {
        if (userId) {
            fetchChats();
        }
    }, [userId]);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats');
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            } else {
                console.error('Failed to fetch chats:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        }
    };

    const fetchChatMessages = async (chatId: string) => {
        setIsLoading(true);
        setActiveChatId(chatId);
        // On mobile, close sidebar when selecting chat
        if (isMobile) setIsSidebarOpen(false);

        try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const messages: any[] = await res.json();
                // Transform flat messages to turns
                const turns: ChatTurn[] = [];
                let currentTurn: ChatTurn | null = null;

                messages.forEach(msg => {
                    if (msg.role === 'user') {
                        if (currentTurn) turns.push(currentTurn);
                        currentTurn = {
                            userMessage: msg.content,
                            responses: []
                        };
                    } else if (msg.role === 'assistant' && currentTurn) {
                        currentTurn.responses.push({
                            modelId: msg.model || 'unknown',
                            text: msg.content,
                            status: 'success'
                        });
                    }
                });
                if (currentTurn) turns.push(currentTurn);
                setChatHistory(turns);
                setTimeout(scrollToBottom, 100);
            } else {
                console.error('Failed to fetch messages:', res.status);
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setChatHistory([]);
        setIsEditing(false);
        if (isMobile) setIsSidebarOpen(false);
    };

    // Save selection
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('selectedModelIds', JSON.stringify(selectedModelIds));
        }
    }, [selectedModelIds, isLoaded]);

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        if (!isMobile) {
            localStorage.setItem('isSidebarOpen', String(newState));
        }
    };

    const toggleModel = (id: string) => {
        if (selectedModelIds.includes(id)) {
            setSelectedModelIds(prev => prev.filter(m => m !== id));
        } else {
            if (selectedModelIds.length < 3) {
                setSelectedModelIds(prev => [...prev, id]);
            }
        }
    };

    const handleRetry = async (modelId: string, turnIndex: number) => {
        if (isLoading) return;

        const turn = chatHistory[turnIndex];
        if (!turn) return;

        setIsLoading(true);

        try {
            console.log(`Retrying model ${modelId}...`);
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: turn.userMessage }],
                    selectedModels: [modelId],
                    chatId: activeChatId,
                    modelHistories: {
                        [modelId]: buildModelHistory(modelId, chatHistory.slice(0, turnIndex), turn.userMessage)
                    }
                })
            });

            const data = await res.json();
            const result = data.results[0];

            setChatHistory(prev => {
                const newHistory = [...prev];
                const targetTurn = newHistory[turnIndex];
                if (!targetTurn) return prev;

                const responseIndex = targetTurn.responses?.findIndex((r: any) => r.modelId === modelId) ?? -1;

                if (responseIndex !== -1 && targetTurn.responses) {
                    targetTurn.responses[responseIndex] = {
                        modelId: result.id,
                        text: result.text || '',
                        status: result.status || (result.error ? 'failed' : 'success'),
                        error: result.error,
                        note: result.note
                    } as any;
                }
                return newHistory;
            });

            fetchUserStatus();

        } catch (e) {
            console.error("Retry failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || selectedModelIds.length === 0 || isLoading) return;

        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setTimeout(scrollToBottom, 50);

        if (isEditing) {
            setIsEditing(false);
            setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    userMessage: currentInput,
                    responses: selectedModelIds.map(id => ({
                        modelId: id,
                        text: '',
                        status: 'busy'
                    }))
                };
                return updated;
            });
        } else {
            const newTurn: ChatTurn = {
                userMessage: currentInput,
                responses: selectedModelIds.map(id => ({
                    modelId: id,
                    text: '',
                    status: 'busy'
                }))
            };
            setChatHistory(prev => [...prev, newTurn]);
        }

        try {
            const messagesPayload = [{ role: 'user', content: currentInput }];

            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'chat_message_sent', {
                    page: 'chat',
                    feature: 'ai_chat'
                });
            }

            const modelHistories: Record<string, any[]> = {};
            selectedModelIds.forEach(id => {
                modelHistories[id] = buildModelHistory(id, chatHistory, currentInput);
            });

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesPayload,
                    selectedModels: selectedModelIds,
                    chatId: activeChatId,
                    modelHistories
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                let isTrialError = false;
                try {
                    const errJson = JSON.parse(errorText);
                    if (errJson.code === 'TRIAL_EXHAUSTED') {
                        isTrialError = true;
                    }
                } catch (e) { }

                if (isTrialError) {
                    setPremiumTrialUsed(TRIAL_LIMIT);
                    window.alert("Premium Trial Exhausted. Redirecting to Pricing...");
                    window.location.href = '/pricing';
                    return;
                }

                console.error(`API Error (${res.status}):`, errorText);
                throw new Error(`Network error: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const data = await res.json();
            const results = data.results;

            if (data.chatId && data.chatId !== activeChatId) {
                setActiveChatId(data.chatId);
                fetchChats();
            }

            setChatHistory(prev => {
                const updated = [...prev];
                const mappedResponses = selectedModelIds.map((id, idx) => {
                    const internalResult = results.find((r: any) => r.id === id) || results[idx];

                    if (!internalResult) {
                        return {
                            modelId: id,
                            text: '',
                            status: 'failed' as const,
                            error: 'Not processed (Limit excceded)'
                        };
                    }

                    return {
                        modelId: id,
                        text: internalResult.text,
                        status: internalResult.status || (internalResult.error ? 'failed' : 'success'),
                        error: internalResult.error,
                        note: internalResult.note || (internalResult.id !== id ? `Fallback: ${internalResult.name}` : undefined)
                    };
                });

                updated[updated.length - 1] = {
                    userMessage: currentInput,
                    responses: mappedResponses as any
                };
                return updated;
            });

            fetchUserStatus();

        } catch (err: any) {
            console.error('Chat error:', err);
            setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].responses = selectedModelIds.map(id => ({
                    modelId: id, text: '', status: 'failed' as const, error: err.message
                }));
                return updated;
            });
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this chat?")) return;

        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) {
            handleNewChat();
        }

        try {
            const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            if (!res.ok) fetchChats();
        } catch (error) {
            fetchChats();
        }
    };

    const handleClearAllChats = async () => {
        if (!window.confirm("Are you sure you want to delete ALL chats? This cannot be undone.")) return;

        setChats([]);
        handleNewChat();

        try {
            const res = await fetch('/api/chats', { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed");
        } catch (error) {
            fetchChats();
        }
    };

    if (!isLoaded) return <div className="bg-[#0B0B0B] h-screen w-full flex items-center justify-center"></div>;

    return (
        <div className="flex h-screen w-full bg-[#0B0B0B] text-zinc-100 overflow-hidden relative selection:bg-blue-500/30">

            {/* Sidebar Desktop */}
            <aside
                className={clsx(
                    "hidden md:flex flex-col border-r border-white/5 bg-[#121212] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden z-20",
                    isSidebarOpen ? "w-[260px]" : "w-[60px]"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header Padded */}
                    <div className="h-14 flex items-center justify-between px-3 border-b border-white/5">
                        {isSidebarOpen ? (
                            <button
                                onClick={handleNewChat}
                                className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-lg transition-colors text-sm font-medium"
                            >
                                <SquarePen className="w-4 h-4" />
                                <span className="truncate">New Chat</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleNewChat}
                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors mx-auto"
                                title="New Chat"
                            >
                                <SquarePen className="w-5 h-5" />
                            </button>
                        )}

                        {isSidebarOpen && (
                            <button onClick={toggleSidebar} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {isSidebarOpen ? (
                            chats.map((chat: any) => (
                                <button
                                    key={chat.id}
                                    onClick={() => fetchChatMessages(chat.id)}
                                    className={clsx(
                                        "w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all duration-200 group flex items-center justify-between gap-2",
                                        activeChatId === chat.id
                                            ? "bg-[#1C1C1C] text-zinc-100"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                    )}
                                >
                                    <span className="truncate flex-1">{chat.title || "New Chat"}</span>
                                    {activeChatId === chat.id && (
                                        <div
                                            onClick={(e) => handleDeleteChat(e, chat.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-zinc-500 hover:text-red-400"
                                        >
                                            <Trash2 size={13} />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            // Collapsed Icons Only (optional - or just hide list)
                            chats.slice(0, 5).map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => fetchChatMessages(chat.id)}
                                    className={clsx(
                                        "w-full flex justify-center py-3 rounded-lg hover:bg-white/5 transition-colors",
                                        activeChatId === chat.id ? "text-white bg-white/5" : "text-zinc-500"
                                    )}
                                    title={chat.title}
                                >
                                    <MessageSquare size={18} />
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-white/5 space-y-1">
                        {!isSidebarOpen && (
                            <button onClick={toggleSidebar} className="w-full flex justify-center p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <PanelLeft className="w-5 h-5" />
                            </button>
                        )}

                        {isSidebarOpen && (
                            <div className="space-y-1">
                                <a href="/privacy-policy" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Settings className="w-4 h-4" />
                                    Privacy & Settings
                                </a>
                                <div className="px-3 py-2">
                                    <UserButton />
                                </div>
                            </div>
                        )}
                        {!isSidebarOpen && (
                            <div className="flex justify-center py-2">
                                <UserButton
                                    appearance={{
                                        elements: { userButtonAvatarBox: "w-8 h-8" }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-[280px] bg-[#121212] flex flex-col z-50 transform transition-transform border-r border-white/5 shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Mobile Sidebar Content is simpler duplication for safety */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <span className="font-semibold text-zinc-200">Menu</span>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500"><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            <button onClick={handleNewChat} className="w-full py-2 bg-white text-black rounded-lg font-medium mb-4">New Chat</button>
                            {chats.map((chat: any) => (
                                <div key={chat.id} onClick={() => fetchChatMessages(chat.id)} className="py-3 text-zinc-400 border-b border-white/5 truncate">
                                    {chat.title || "New Chat"}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative bg-[#0B0B0B]">

                {/* Header */}
                <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B0B0B]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen || isMobile ? (
                            <button onClick={toggleSidebar} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
                                {isMobile ? <Menu size={20} /> : <PanelLeft size={20} />}
                            </button>
                        ) : <div className="w-0" />}

                        <ModelSelector
                            selectedModelIds={selectedModelIds}
                            onToggle={toggleModel}
                            disabled={isLoading}
                            isPremium={isPremium}
                        />
                    </div>
                </header>

                {/* Messages Area - Centered and Clean */}
                <div className="flex-1 overflow-y-auto w-full p-4 scroll-smooth custom-scrollbar">
                    <div className="max-w-[850px] mx-auto flex flex-col min-h-full pb-8">

                        {chatHistory.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                                <div className="relative w-[300px] h-[300px] mb-8 animate-in fade-in zoom-in duration-1000">
                                    <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                                    <img
                                        src="/welcome-header.png"
                                        alt="Universal AI"
                                        className="relative w-full h-full object-contain drop-shadow-2xl"
                                    />
                                </div>
                                <h2 className="text-2xl font-semibold text-white">How can I help you today?</h2>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-10 py-6">
                                {chatHistory.map((turn, idx) => (
                                    <div key={idx} className="flex flex-col gap-6">
                                        {/* User Message - Right Aligned */}
                                        <div className="flex justify-end">
                                            <div className="bg-[#212121] text-zinc-100 px-5 py-3 rounded-3xl rounded-tr-sm max-w-[85%] text-[15px] leading-relaxed break-words">
                                                {turn.userMessage}
                                            </div>
                                        </div>

                                        {/* AI Responses - Grid if multiple, or single block */}
                                        <div className={`grid gap-5 w-full`} style={{
                                            gridTemplateColumns: `repeat(${Math.max(1, selectedModelIds.length)}, minmax(0, 1fr))`
                                        }}>
                                            {selectedModelIds.map(modelId => {
                                                const response = turn.responses.find((r: any) => r.modelId === modelId);
                                                const model = getModelById(modelId);
                                                if (!model) return null;

                                                // If we have content or loading, show card. 
                                                // If busy but not primary, we still show placeholders.

                                                return (
                                                    <div key={modelId} className="min-w-0">
                                                        <ModelResponseCard
                                                            model={model}
                                                            messages={response?.text ? [{ role: 'assistant', content: response.text }] : []}
                                                            isLoading={isLoading && (!response || response.status === 'busy')}
                                                            error={response?.error}
                                                            status={response?.status}
                                                            note={response?.note}
                                                            onRetry={() => handleRetry(modelId, idx)}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} className="h-px" />
                            </div>
                        )}

                    </div>
                </div>

                {/* Input Area - Sticky Bottom */}
                <div className="p-4 pb-6 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B] to-transparent z-20">
                    <ChatInput
                        input={input}
                        handleInputChange={(e) => setInput(e.target.value)}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        disabled={selectedModelIds.length === 0}
                    />
                    <div className="text-center mt-3">
                        <span className="text-[11px] text-zinc-600">
                            Universal AI can make mistakes. Consider checking important information.
                        </span>
                    </div>
                </div>

            </main>
        </div>
    );
}
