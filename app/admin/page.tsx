import { adminDb } from '@/lib/admin-db';
import { LayoutDashboard, Users, MessageSquare, AlertTriangle } from 'lucide-react';

export default async function AdminDashboard() {
    const stats = {
        totalUsers: await adminDb.getTotalUsers(),
        activeUsers: await adminDb.getActiveUsers(30),
        freeUsers: await adminDb.getUsersByPlan('free'),
        proUsers: await adminDb.getUsersByPlan('pro'),
        totalMessages: await adminDb.getTotalMessages(),
        recentErrors: await adminDb.getErrorCount(24),
        openTickets: await adminDb.getOpenTicketsCount(),
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Total Users */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-sm text-zinc-500">Total</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{stats.totalUsers}</p>
                    <p className="text-sm text-zinc-400">Total Users</p>
                </div>

                {/* Active Users */}
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <LayoutDashboard className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-sm text-zinc-500">30 days</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{stats.activeUsers}</p>
                    <p className="text-sm text-zinc-400">Active Users</p>
                </div>

                {/* Total Messages */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-sm text-zinc-500">All time</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{stats.totalMessages.toLocaleString()}</p>
                    <p className="text-sm text-zinc-400">Messages Sent</p>
                </div>

                {/* Recent Errors */}
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-sm text-zinc-500">24h</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{stats.recentErrors}</p>
                    <p className="text-sm text-zinc-400">Recent Errors</p>
                </div>
            </div>

            {/* User Plan Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">User Plans</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Free Plan</p>
                                <p className="text-sm text-zinc-500">{((stats.freeUsers / stats.totalUsers) * 100).toFixed(1)}% of users</p>
                            </div>
                            <p className="text-2xl font-bold">{stats.freeUsers}</p>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="font-medium">Pro Plan</p>
                                <p className="text-sm text-zinc-500">{((stats.proUsers / stats.totalUsers) * 100).toFixed(1)}% of users</p>
                            </div>
                            <p className="text-2xl font-bold">{stats.proUsers}</p>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${(stats.proUsers / stats.totalUsers) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <a
                            href="/admin/users"
                            className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                        >
                            <p className="font-medium mb-1">Manage Users</p>
                            <p className="text-sm text-zinc-500">View and manage user accounts</p>
                        </a>
                        <a
                            href="/admin/errors"
                            className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                        >
                            <p className="font-medium mb-1">View Error Logs</p>
                            <p className="text-sm text-zinc-500">{stats.recentErrors} errors in last 24h</p>
                        </a>
                        <a
                            href="/admin/support"
                            className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                        >
                            <p className="font-medium mb-1">Support Tickets</p>
                            <p className="text-sm text-zinc-500">{stats.openTickets} open tickets</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
