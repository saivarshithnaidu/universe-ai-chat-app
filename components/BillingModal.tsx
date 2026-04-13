'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Phone, User, Home, Globe } from 'lucide-react';

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any) => void;
    userEmail: string;
}

export default function BillingModal({ isOpen, onClose, onComplete, userEmail }: BillingModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: userEmail,
        phone: '',
        address_line1: '',
        address_line2: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
    });

    useEffect(() => {
        if (isOpen) {
            // Fetch existing data
            fetch('/api/billing')
                .then(res => res.json())
                .then(data => {
                    if (data.name) setFormData(prev => ({ ...prev, ...data, email: userEmail }));
                });
        }
    }, [isOpen, userEmail]);

    const autoDetectLocation = async () => {
        setFetchingLocation(true);
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                city: data.city || prev.city,
                state: data.region || prev.state,
                country: data.country_name || prev.country,
                pincode: data.postal || prev.pincode
            }));
        } catch (error) {
            console.error('Location detection failed:', error);
        } finally {
            setFetchingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                onComplete(formData);
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to save billing details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold">Billing Details</h2>
                        <p className="text-sm text-zinc-400">Required for invoicing & tax compliance</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={autoDetectLocation}
                            disabled={fetchingLocation}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                            <MapPin className="w-3 h-3" />
                            {fetchingLocation ? 'Detecting...' : 'Auto-detect Location'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 opacity-60">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">Email (Auto-filled)</label>
                            <input
                                disabled
                                value={formData.email}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    required
                                    pattern="\d{10}"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                                    placeholder="10 digit number"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">Pincode / Zip</label>
                            <input
                                required
                                pattern="\d{6}"
                                maxLength={6}
                                value={formData.pincode}
                                onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:border-blue-500/50 outline-none"
                                placeholder="6 digits"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase">Address Line 1</label>
                        <div className="relative">
                            <Home className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <textarea
                                required
                                value={formData.address_line1}
                                onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none min-h-[60px]"
                                placeholder="House / Flat No, Building Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase">Area / Street (Landmark)</label>
                        <input
                            required
                            value={formData.area}
                            onChange={e => setFormData({ ...formData, area: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:border-blue-500/50 outline-none"
                            placeholder="Sector, Cross road, etc"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">City / District</label>
                            <input
                                required
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:border-blue-500/50 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">State</label>
                            <input
                                required
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm focus:border-blue-500/50 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-zinc-400 uppercase">Country</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    required
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {loading ? 'Saving Details...' : 'Save & Procced to Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
