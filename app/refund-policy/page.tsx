import React from "react";

export const metadata = {
    title: "Refund & Cancellation Policy – UniversalAI",
};

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold mb-8">Refund & Cancellation Policy – UniversalAI</h1>

                <section className="space-y-4">
                    <p className="text-gray-300">
                        All payments made to UniversalAI are final and non-refundable.
                    </p>
                    <p className="text-gray-300">
                        Access to paid features is granted immediately after successful payment.
                        Therefore, refunds or cancellations are not supported.
                    </p>
                    <p className="text-gray-300">
                        If a payment is deducted but access is not granted due to a technical issue,
                        users may contact support within 48 hours.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Contact</h2>
                    <p className="text-gray-300">
                        <a href="mailto:support@universalai.co.in" className="text-blue-400 hover:underline">support@universalai.co.in</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
