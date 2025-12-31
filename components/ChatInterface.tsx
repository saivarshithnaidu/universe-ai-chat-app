'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AVAILABLE_MODELS, getModelById, AIModel } from '@/lib/models';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { ChevronLeft, Menu, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
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

    const handleEdit = (userMessage: string) => {
        setInput(userMessage);
        setIsEditing(true);
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

    if (!isLoaded) return <div className="p-8 bg-[#0B0B0B] text-zinc-500 h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="flex h-screen w-full bg-[#0B0B0B] text-zinc-100 overflow-hidden relative selection:bg-blue-500/30">

            {/* Sidebar Desktop */}
            <aside
                className={clsx(
                    "hidden md:flex flex-col border-r border-white/5 bg-[#121212] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden z-10",
                    isSidebarOpen ? "w-[280px] opacity-100" : "w-0 opacity-0"
                )}
            >
                {/* Sidebar Content */}
                <SidebarContent
                    chats={chats}
                    activeChatId={activeChatId}
                    fetchChatMessages={fetchChatMessages}
                    handleNewChat={handleNewChat}
                    handleDeleteChat={handleDeleteChat}
                    handleClearAllChats={handleClearAllChats}
                />
            </aside>

            {/* Sidebar Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}>
                    <div
                        className="fixed inset-y-0 left-0 w-[280px] bg-[#121212] flex flex-col z-50 transform transition-transform border-r border-white/5 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <SidebarContent
                            chats={chats}
                            activeChatId={activeChatId}
                            fetchChatMessages={fetchChatMessages}
                            handleNewChat={handleNewChat}
                            handleDeleteChat={handleDeleteChat}
                            handleClearAllChats={handleClearAllChats}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative bg-[#0B0B0B]">

                {/* Header Toggle (Visible always) */}
                <div className="absolute top-4 left-4 z-20">
                    <button
                        onClick={toggleSidebar}
                        className={clsx(
                            "p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all",
                            (isSidebarOpen && !isMobile) && "opacity-0 pointer-events-none"
                        )}
                        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {!isSidebarOpen && <Menu size={20} />}
                        {isSidebarOpen && <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Scrollable Messages Area */}
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 scroll-smooth no-scrollbar">

                    {/* Spacer for toggle button */}
                    <div className="h-6"></div>

                    {/* Header & Selector */}
                    <div className="flex flex-col gap-6 mb-8 pl-10 md:pl-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">Multi-Model Chat</h1>
                                    {isPremium && (
                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-500 text-sm">
                                    Compare intelligent responses side-by-side.
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                {activeChatId && (
                                    <button
                                        onClick={(e) => handleDeleteChat(e, activeChatId)}
                                        className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/5 border border-transparent hover:border-red-500/10"
                                        title="Delete current chat"
                                    >
                                        <Trash2 size={14} />
                                        Delete Chat
                                    </button>
                                )}

                                {!isPremium && premiumTrialUsed > 0 && (
                                    <div className={clsx(
                                        "text-[10px] font-semibold px-2 py-1 rounded bg-zinc-900 border border-white/5",
                                        premiumTrialUsed >= TRIAL_LIMIT ? "text-red-400 border-red-500/20" : "text-zinc-500"
                                    )}>
                                        Trial: {premiumTrialUsed} / {TRIAL_LIMIT}
                                    </div>
                                )}
                            </div>
                        </div>

                        <ModelSelector
                            selectedModelIds={selectedModelIds}
                            onToggle={toggleModel}
                            disabled={isLoading}
                            isPremium={isPremium}
                            trialUsage={premiumTrialUsed}
                            trialLimit={TRIAL_LIMIT}
                        />
                    </div>

                    {/* Chat Messages */}
                    <div className="flex flex-col gap-8 pb-4">
                        {chatHistory.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-20 gap-6 animate-in fade-in zoom-in duration-700">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center ring-1 ring-white/5 shadow-xl">
                                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                                </div>
                                <div className="text-center space-y-2 max-w-sm">
                                    <h3 className="text-lg font-medium text-white">Start a new comparison</h3>
                                    <p className="text-sm text-zinc-500">
                                        Select up to 3 models above to transparently compare their reasoning and speed.
                                    </p>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((turn, idx) => (
                            <div key={idx} className="flex flex-col gap-6 group">
                                <div className="flex justify-end group/message">
                                    <div className="flex items-center gap-3">
                                        {idx === chatHistory.length - 1 && !isLoading && (
                                            <button
                                                onClick={() => handleEdit(turn.userMessage)}
                                                className="p-2 text-zinc-600 hover:text-white opacity-0 group-hover/message:opacity-100 transition-all hover:bg-white/5 rounded-lg"
                                                title="Edit message"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <div className="bg-[#1C1C1C] border border-white/5 rounded-2xl rounded-tr-sm px-5 py-3 text-zinc-200 max-w-2xl text-[15px] leading-relaxed shadow-sm">
                                            {turn.userMessage}
                                        </div>
                                    </div>
                                </div>

                                <div className={`grid gap-4 w-full`} style={{
                                    gridTemplateColumns: `repeat(${Math.max(1, selectedModelIds.length)}, minmax(0, 1fr))`
                                }}>
                                    {selectedModelIds.length > 0 ? selectedModelIds.map(modelId => {
                                        const response = turn.responses.find((r: any) => r.modelId === modelId);
                                        const model = getModelById(modelId);

                                        if (!model) return null;

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
                                    }) : (
                                        <div className="text-center text-zinc-600 text-sm py-4">Select a model to see response</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Anchor for auto-scroll */}
                    <div ref={messagesEndRef} className="h-px w-full" />
                </div>

                {/* Fixed Input Area */}
                <div className="flex-none p-4 pb-6 glass z-30 w-full">
                    <div className="max-w-4xl mx-auto w-full">
                        <ChatInput
                            input={input}
                            handleInputChange={(e) => setInput(e.target.value)}
                            handleSubmit={handleSubmit}
                            isLoading={isLoading}
                            disabled={selectedModelIds.length === 0}
                        />
                        <p className="text-center text-[10px] md:text-[11px] text-zinc-600 mt-3 font-medium">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}

// Extracted Sidebar Content for reusability (Desktop/Mobile)
function SidebarContent({
    chats,
    activeChatId,
    fetchChatMessages,
    handleNewChat,
    handleDeleteChat,
    handleClearAllChats
}: any) {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 border-b border-white/5">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 text-black hover:bg-white transition-all font-medium text-sm rounded-lg shadow-sm active:scale-[0.98]"
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {chats.map((chat: any) => (
                    <button
                        key={chat.id}
                        onClick={() => fetchChatMessages(chat.id)}
                        className={clsx(
                            "w-full text-left px-3 py-3 rounded-lg text-sm truncate transition-all duration-200 group flex items-center justify-between gap-2 border",
                            activeChatId === chat.id
                                ? "bg-[#1C1C1C] text-white border-white/5 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-transparent"
                        )}
                    >
                        <span className="truncate flex-1 font-medium">{chat.title || "New Chat"}</span>
                        <div
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                            className={clsx(
                                "p-1 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400",
                                activeChatId === chat.id ? "text-zinc-500" : "text-zinc-600"
                            )}
                            role="button"
                            title="Delete chat"
                        >
                            <Trash2 size={13} />
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-white/5 flex flex-col gap-3 bg-[#121212]">
                {chats.length > 0 && (
                    <button
                        onClick={handleClearAllChats}
                        className="w-full text-xs font-medium text-zinc-500 hover:text-red-400 flex items-center justify-center gap-1.5 py-2 transition-colors border border-transparent hover:border-red-500/10 hover:bg-red-500/5 rounded-md"
                    >
                        <Trash2 size={12} />
                        Clear History
                    </button>
                )}

                <div className="flex items-center justify-between px-1">
                    <a href="/privacy" className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                        Privacy Policy
                    </a>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "size-7 ring-2 ring-white/5"
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </div>
    );
}
