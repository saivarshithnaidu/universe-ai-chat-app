'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Ticket {
    id: string;
    user_email: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string | null;
    created_at: string;
    updated_at: string;
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            ...(statusFilter && { status: statusFilter }),
        });

        const res = await fetch(`/api/admin/support?${params}`);
        const data = await res.json();
        setTickets(data || []);
        setLoading(false);
    };

    const updateStatus = async (ticketId: string, newStatus: string) => {
        const res = await fetch(`/api/admin/support/${ticketId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        if (res.ok) {
            fetchTickets();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'open': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return <LifeBuoy className="w-5 h-5 text-zinc-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'open': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default: return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Support Tickets</h1>
                <p className="text-zinc-400">{tickets.length} tickets</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="text-center py-12 text-zinc-500">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-[#121212] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">{getStatusIcon(ticket.status)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority.toUpperCase()}
                                        </span>
                                        {ticket.category && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-400 border border-white/10">
                                                {ticket.category}
                                            </span>
                                        )}
                                        <span className="text-sm text-zinc-500">
                                            {new Date(ticket.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{ticket.subject}</h3>
                                    <p className="text-zinc-400 mb-3">{ticket.description}</p>
                                    <p className="text-sm text-zinc-500 mb-4">From: {ticket.user_email}</p>

                                    {/* Status Actions */}
                                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <div className="flex gap-2">
                                            {ticket.status === 'open' && (
                                                <button
                                                    onClick={() => updateStatus(ticket.id, 'in_progress')}
                                                    className="px-4 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors text-blue-400"
                                                >
                                                    Start Working
                                                </button>
                                            )}
                                            <button
                                                onClick={() => updateStatus(ticket.id, 'resolved')}
                                                className="px-4 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors text-green-400"
                                            >
                                                Mark Resolved
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {tickets.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No support tickets found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
