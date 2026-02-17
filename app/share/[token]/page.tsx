'use client';

import { use, useEffect, useState } from 'react';
import { stripMarkdown } from '@/lib/markdown-stripper';
import { getModelById } from '@/lib/models';
import { Bot } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    model?: string;
}

interface Chat {
    id: string;
    title: string;
    created_at: string;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
    const resolvedParams = use(params);
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSharedChat = async () => {
            try {
                const res = await fetch(`/api/share/${resolvedParams.token}`);
                if (!res.ok) {
                    setError('Chat not found or not shared');
                    return;
                }

                const data = await res.json();
                setChat(data.chat);
                setMessages(data.messages);
            } catch (err) {
                setError('Failed to load shared chat');
            } finally {
                setLoading(false);
            }
        };

        fetchSharedChat();
    }, [resolvedParams.token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    if (error || !chat) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
                <div className="text-red-400">{error || 'Chat not found'}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-zinc-100">
            <header className="border-b border-white/5 bg-[#121212] px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold text-white">{chat.title}</h1>
                    <p className="text-xs text-zinc-500 mt-1">Shared from Universal AI</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 py-8">
                <div className="space-y-8">
                    {messages.map((msg, idx) => (
                        <div key={idx}>
                            {msg.role === 'user' ? (
                                <div className="flex justify-end mb-4">
                                    <div className="bg-[#212121] text-zinc-100 px-5 py-3 rounded-3xl rounded-tr-sm max-w-[85%] text-[15px] leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#181818] rounded-2xl p-5 mb-4">
                                    <div className="flex items-center gap-2 mb-3 text-sm text-zinc-400">
                                        <Bot className="w-4 h-4" />
                                        <span>{msg.model ? getModelById(msg.model)?.name : 'AI'}</span>
                                    </div>
                                    <div className="text-[15px] leading-[1.7] text-zinc-100 whitespace-pre-line">
                                        {stripMarkdown(msg.content)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Create your own AI chat
                    </a>
                </div>
            </main>
        </div>
    );
}
