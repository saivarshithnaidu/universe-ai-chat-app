'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, getModelById } from '@/lib/models';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { Pencil, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import clsx from 'clsx';
import { db, Chat, Message } from '@/lib/db'; // Types only, since db is server-side. Wait, db is server-side. I need to define local interfaces.

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

const buildModelHistory = (modelId: string, history: ChatTurn[], currentMessage: string) => {
    const messages = [];
    // Add previous turns
    history.forEach(turn => {
        messages.push({ role: 'user', content: turn.userMessage });
        const response = turn.responses.find(r => r.modelId === modelId);
        if (response && response.text) {
            messages.push({ role: 'assistant', content: response.text });
        }
    });
    // Add current message
    messages.push({ role: 'user', content: currentMessage });
    return messages;
};

export function ChatInterface() {
    const router = useRouter();
    const { userId } = useAuth();
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);

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

    // Load selection from local storage
    useEffect(() => {
        const saved = localStorage.getItem('selectedModelIds');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    const validIds = parsed.filter(id =>
                        AVAILABLE_MODELS.some(m => m.id === id)
                    );
                    setSelectedModelIds(validIds);
                }
            } catch (error) {
                console.error('Failed to load selected models:', error);
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
        try {
            const res = await fetch(`/api/chats/${chatId}`);
            if (res.ok) {
                const messages: any[] = await res.json();
                // Transform flat messages to turns
                const turns: ChatTurn[] = [];
                let currentTurn: ChatTurn | null = null;

                // Simple grouping: Assumes User -> [Assistant, Assistant...] pattern
                // Just robustly handling it
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
    };

    // Save selection
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('selectedModelIds', JSON.stringify(selectedModelIds));
        }
    }, [selectedModelIds, isLoaded]);

    const toggleModel = (id: string) => {
        if (selectedModelIds.includes(id)) {
            setSelectedModelIds(prev => prev.filter(m => m !== id));
        } else {
            if (selectedModelIds.length < 3) {
                setSelectedModelIds(prev => [...prev, id]);
            }
        }
    };

    const [input, setInput] = useState('');

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
                if (!targetTurn) return prev; // Guard against race condition

                const responseIndex = targetTurn.responses?.findIndex((r: any) => r.modelId === modelId) ?? -1;

                if (responseIndex !== -1 && targetTurn.responses) {
                    targetTurn.responses[responseIndex] = {
                        modelId: result.id,
                        text: result.text || '',
                        status: result.status || (result.error ? 'failed' : 'success'),
                        error: result.error,
                        note: result.note
                    };
                }
                return newHistory;
            });

            // Refresh User Status (trial might have incremented)
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
            // Build history context for API? 
            // Currently API assumes just one message or full history. 
            // If we want context, we should probably send previous messages.
            // For now, let's just send the current user message to keep it simple as per earlier logic, 
            // but the API supports `messages` array. Ideally we send context.
            // Let's send the last few turns for context if needed, but for now just the new one is fine 
            // as the prompt implies independent models for now. 
            // Wait, standard chat needs context. "Chat History" implies context. 
            // I'll stick to sending just the current message for simplicity unless requested otherwise 
            // OR if the API is stateless. API seems to take `messages` array.

            const messagesPayload = [{ role: 'user', content: currentInput }];

            // Build separate history for each model
            const modelHistories: Record<string, any[]> = {};
            selectedModelIds.forEach(id => {
                modelHistories[id] = buildModelHistory(id, chatHistory, currentInput);
            });

            console.log('Sending request with models:', selectedModelIds);

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
                // Handle Trial Exhausted
                let isTrialError = false;
                try {
                    const errJson = JSON.parse(errorText);
                    if (errJson.code === 'TRIAL_EXHAUSTED') {
                        isTrialError = true;
                    }
                } catch (e) { }

                if (isTrialError) {
                    // Update usage to max just in case
                    setPremiumTrialUsed(TRIAL_LIMIT);
                    // Use a more gentle UI approach? 
                    // Requirement: "Redirect to /pricing"
                    // We can alert and then redirect.
                    window.alert("Premium Trial Exhausted. Redirecting to Pricing...");
                    window.location.href = '/pricing';
                    // Using location.href instead of router.push for hard redirect safety or just consistency if outside react context? 
                    // We are in Client Component. Let's use window.location for simplicity in error handler if we don't have router in scope 
                    // (Wait, we don't have useRouter in ChatInterface yet).
                    // I will add useRouter.
                    return;
                }

                console.error(`API Error (${res.status}):`, errorText);
                throw new Error(`Network error: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const data = await res.json();
            const results = data.results;

            // Update active chat ID if it was new
            if (data.chatId && data.chatId !== activeChatId) {
                setActiveChatId(data.chatId);
                fetchChats(); // Refresh list to show new chat
            }

            setChatHistory(prev => {
                const updated = [...prev];
                const mappedResponses = selectedModelIds.map((id, idx) => {
                    const internalResult = results[idx];
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
                    responses: mappedResponses
                };
                return updated;
            });

            // Refresh User Status (trial might have incremented)
            fetchUserStatus();

        } catch (err: any) {
            console.error('Chat error:', err);
            setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].responses = selectedModelIds.map(id => ({
                    modelId: id, text: '', status: 'failed', error: err.message
                }));
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this chat?")) return;

        // Optimistic update
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) {
            handleNewChat();
        }

        try {
            const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            if (!res.ok) {
                console.error("Failed to delete chat");
                // Revert if needed, but for now simple logging.
                // ideally we would re-fetch chats here if it failed.
                fetchChats();
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
            fetchChats();
        }
    };

    const handleClearAllChats = async () => {
        if (!window.confirm("Are you sure you want to delete ALL chats? This cannot be undone.")) return;

        // Optimistic update
        setChats([]);
        handleNewChat();

        try {
            const res = await fetch('/api/chats', { method: 'DELETE' });
            if (!res.ok) {
                throw new Error("Failed to delete all chats");
            }
        } catch (error) {
            console.error("Failed to delete all chats:", error);
            fetchChats();
        }
    };

    if (!isLoaded) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg hover:opacity-90 transition font-medium text-sm shadow-sm"
                    >
                        <Plus size={16} />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {chats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => fetchChatMessages(chat.id)}
                            className={clsx(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors",
                                activeChatId === chat.id
                                    ? "bg-white dark:bg-zinc-800/80 shadow-sm font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-transparent"
                            ) + " group flex items-center justify-between gap-2"}
                        >
                            <span className="truncate flex-1">{chat.title || "New Chat"}</span>
                            <div
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-1"
                                role="button"
                                title="Delete chat"
                            >
                                <Trash2 size={13} />
                            </div>
                        </button>
                    ))}
                    {chats.length === 0 && (
                        <div className="text-center py-8 text-xs text-zinc-400">
                            No chat history
                        </div>
                    )}
                    {chats.length > 0 && (
                        <div className="mt-4 px-2">
                            <button
                                onClick={handleClearAllChats}
                                className="w-full text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-1.5 py-2 transition-colors border-t border-zinc-100 dark:border-zinc-800/50"
                            >
                                <Trash2 size={12} />
                                Clear all history
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
                    <a href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors">
                        Privacy Policy
                    </a>
                    <div className="flex items-center justify-between">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium hover:underline">Sign In</button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "w-8 h-8"
                                    }
                                }}
                            />
                        </SignedIn>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white dark:bg-[#09090b]">
                {/* Removed max-w-6xl mx-auto to allow full width, flush right alignment */}
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">

                    {/* Header & Selector */}
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">Multi-Model Chat</h1>
                                    {isPremium && (
                                        <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-500">
                                    Select up to 3 models to compare responses side-by-side.
                                </p>
                            </div>
                            {/* Right Side Actions */}
                            <div className="flex flex-col items-end gap-3">
                                {activeChatId && (
                                    <button
                                        onClick={(e) => handleDeleteChat(e, activeChatId)}
                                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                        title="Delete current chat"
                                    >
                                        <Trash2 size={16} />
                                        Delete Chat
                                    </button>
                                )}

                                {/* Premium Trial Banner */}
                                {!isPremium && premiumTrialUsed > 0 && (
                                    <div className={clsx(
                                        "text-xs font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
                                        premiumTrialUsed >= TRIAL_LIMIT ? "text-red-500 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
                                    )}>
                                        Premium Trial: {premiumTrialUsed} / {TRIAL_LIMIT} messages used
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

                    {/* Chat Area */}
                    <div className="flex flex-col gap-8 pb-32">
                        {chatHistory.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-20 gap-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-inner">
                                    <MessageSquare className="w-10 h-10 opacity-30" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Welcome to Universe AI</h3>
                                    <p className="max-w-xs mx-auto text-sm text-zinc-500">
                                        Select up to 3 models above and start a conversation to see them compare side-by-side.
                                    </p>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((turn, idx) => (
                            <div key={idx} className="flex flex-col gap-6 group">
                                {/* User Message */}
                                <div className="flex justify-end group/message">
                                    <div className="flex items-center gap-2">
                                        {/* Edit Button */}
                                        {idx === chatHistory.length - 1 && !isLoading && (
                                            <button
                                                onClick={() => handleEdit(turn.userMessage)}
                                                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover/message:opacity-100 transition-opacity"
                                                title="Edit message"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tr-sm px-6 py-4 text-zinc-800 dark:text-zinc-200 max-w-2xl text-base leading-relaxed">
                                            {turn.userMessage}
                                        </div>
                                    </div>
                                </div>

                                {/* Model Responses Row */}
                                <div className={`grid gap-4 w-full`} style={{
                                    gridTemplateColumns: `repeat(${selectedModelIds.length}, minmax(0, 1fr))`
                                }}>
                                    {selectedModelIds.map(modelId => {
                                        const response = turn.responses.find(r => r.modelId === modelId);
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
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black pb-8 pointer-events-none">
                    <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                        <ChatInput
                            input={input}
                            handleInputChange={(e) => setInput(e.target.value)}
                            handleSubmit={handleSubmit}
                            isLoading={isLoading}
                            disabled={selectedModelIds.length === 0}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
