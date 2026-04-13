'use client';

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import BillingModal from './BillingModal';

interface CheckoutButtonProps {
    amount: number;
    plan: string;
    className?: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://universalai.co.in';

export default function CheckoutButton({ amount, plan, className }: CheckoutButtonProps) {
    const { data: session, status } = useSession();
    const user = session?.user;
    const isLoaded = status !== "loading";
    const [loading, setLoading] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const router = useRouter();

    const startCheckout = () => {
        if (!isLoaded || !user) {
            router.push('/login');
            return;
        }
        setShowBilling(true);
    };

    const handleBillingComplete = async (billingData: any) => {
        if (!user) return;
        setShowBilling(false);
        setLoading(true);

        try {
            // Client-side detection for development mode
            const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            
            const res = await fetch('/api/payment/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    plan, 
                    billing: billingData,
                    // If in dev mode, we can pass amount=1 to trigger the backend test logic
                    amount: isDev ? 1 : amount 
                }),
            });

            const order = await res.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Universal AI',
                description: `Upgrade to ${plan.toUpperCase()} Plan`,
                order_id: order.id,
                handler: async function (response: any) {
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan
                        }),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        alert('Subscription activated! You are now a Pro user.');
                        router.refresh();
                        // Redirect using full URL to avoid routing issues
                        window.location.href = `${BASE_URL}/app`;
                    } else {
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: billingData.name,
                    email: user.email,
                    contact: billingData.phone,
                },
                notes: {
                    ...billingData,
                    userId: (user as any).id || '',
                    plan
                },
                theme: {
                    color: '#3b82f6',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment failed: ${response.error.description || 'Try again'}`);
            });
            rzp.open();
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={startCheckout}
                disabled={loading}
                className={className || "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"}
            >
                {loading ? 'Processing...' : (
                    <>
                        <Zap className="w-4 h-4" />
                        Upgrade Now
                    </>
                )}
            </button>

            {user && (
                <BillingModal
                    isOpen={showBilling}
                    onClose={() => setShowBilling(false)}
                    onComplete={handleBillingComplete}
                    userEmail={user.email || ''}
                />
            )}
        </>
    );
}

