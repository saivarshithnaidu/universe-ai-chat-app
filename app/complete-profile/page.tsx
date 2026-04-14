'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Phone, Globe, ChevronRight, Zap } from 'lucide-react';

export default function CompleteProfile() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        country: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate saving
        setTimeout(() => {
            router.push('/app');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-white/10">
                        <Shield className="text-blue-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Almost There</h1>
                    <p className="text-zinc-400">Please provide a few more details to secure your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Country</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="United States"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    value={formData.country}
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : "Enter Workspace"}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </form>

                <div className="mt-8 flex justify-center gap-6 opacity-30 grayscale items-center">
                    <div className="flex items-center gap-1">
                        <Shield size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Zap size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Fast Setup</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
