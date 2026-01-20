import React from "react";

export const metadata = {
    title: "Privacy Policy – Universal AI",
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy – Universal AI</h1>

                <section className="space-y-4">
                    <p className="text-gray-300">
                        At Universal AI, we respect your privacy and are committed to protecting your personal data.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Information We Collect</h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Name and email address (via authentication)</li>
                        <li>Subscription and payment status</li>
                        <li>Usage data for improving AI responses</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Payments</h2>
                    <p className="text-gray-300">
                        All payments are processed securely by Razorpay.
                        Universal AI does NOT store card details, UPI PINs, or bank information.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Data Usage</h2>
                    <p className="text-gray-300">
                        User data is used only to provide AI services, manage subscriptions, and improve experience.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Contact</h2>
                    <p className="text-gray-300">
                        Email: <a href="mailto:support@universalai.co.in" className="text-blue-400 hover:underline">support@universalai.co.in</a>
                    </p>
                </section>

                <p className="text-sm text-gray-500 mt-8 pt-8 border-t border-gray-800">
                    Last updated: January 2026
                </p>
            </div>
        </div>
    );
}
