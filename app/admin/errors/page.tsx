'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ErrorLog {
    id: string;
    error_type: string;
    severity: string;
    message: string;
    user_id: string | null;
    endpoint: string | null;
    created_at: string;
}

export default function ErrorsPage() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [typeFilter, setTypeFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchErrors();
    }, [typeFilter, severityFilter]);

    const fetchErrors = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            ...(typeFilter && { type: typeFilter }),
            ...(severityFilter && { severity: severityFilter }),
        });

        const res = await fetch(`/api/admin/errors?${params}`);
        const data = await res.json();
        setErrors(data || []);
        setLoading(false);
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Error Logs</h1>
                <p className="text-zinc-400">{errors.length} errors</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                    <option value="">All Types</option>
                    <option value="model_api">Model API</option>
                    <option value="payment">Payment</option>
                    <option value="auth">Authentication</option>
                    <option value="database">Database</option>
                    <option value="general">General</option>
                </select>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Error List */}
            {loading ? (
                <div className="text-center py-12 text-zinc-500">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {errors.map((error) => (
                        <div
                            key={error.id}
                            className="bg-[#121212] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">{getSeverityIcon(error.severity)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                                            {error.severity.toUpperCase()}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-400 border border-white/10">
                                            {error.error_type}
                                        </span>
                                        <span className="text-sm text-zinc-500">
                                            {new Date(error.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-white mb-2 font-medium">{error.message}</p>
                                    {error.endpoint && (
                                        <p className="text-sm text-zinc-500">Endpoint: <code className="bg-white/5 px-2 py-1 rounded">{error.endpoint}</code></p>
                                    )}
                                    {error.user_id && (
                                        <p className="text-sm text-zinc-500 mt-1">User ID: {error.user_id}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {errors.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No errors found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
