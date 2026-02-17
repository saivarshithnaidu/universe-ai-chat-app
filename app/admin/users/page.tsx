'use client';

import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

interface User {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    plan: string;
    subscription_status: string | null;
    created_at: string;
    total_messages: number;
    is_disabled: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [search, planFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            ...(search && { search }),
            ...(planFilter && { plan: planFilter }),
        });

        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setLoading(false);
    };

    const handlePlanUpdate = async (userId: string, newPlan: 'free' | 'pro') => {
        if (!confirm(`Change user plan to ${newPlan}?`)) return;

        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: newPlan }),
        });

        if (res.ok) {
            fetchUsers();
        } else {
            alert('Failed to update user plan');
        }
    };

    const handleDisableUser = async (userId: string, disable: boolean) => {
        if (!confirm(`${disable ? 'Disable' : 'Enable'} this user account?`)) return;

        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_disabled: disable }),
        });

        if (res.ok) {
            fetchUsers();
        } else {
            alert('Failed to update user status');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-zinc-400">{total} total users</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                    <option value="">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                </select>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12 text-zinc-500">Loading...</div>
            ) : (
                <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold">User</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold">Plan</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold">Messages</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold">Joined</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium">{user.name || 'Unknown'}</p>
                                            <p className="text-sm text-zinc-500">{user.email || 'No email'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${user.plan === 'pro'
                                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                }`}
                                        >
                                            {user.plan.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-300">{user.total_messages || 0}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_disabled
                                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                }`}
                                        >
                                            {user.is_disabled ? 'Disabled' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePlanUpdate(user.id, user.plan === 'free' ? 'pro' : 'free')}
                                                className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                                            >
                                                {user.plan === 'free' ? 'Upgrade to Pro' : 'Downgrade to Free'}
                                            </button>
                                            <button
                                                onClick={() => handleDisableUser(user.id, !user.is_disabled)}
                                                className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-red-400"
                                            >
                                                {user.is_disabled ? 'Enable' : 'Disable'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                        <p className="text-sm text-zinc-500">
                            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 50 >= total}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
