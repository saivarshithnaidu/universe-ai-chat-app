import React from "react";

export const metadata = {
    title: "Terms & Conditions – Universal AI",
};

export default function Terms() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold mb-8">Terms & Conditions – Universal AI</h1>

                <section className="space-y-4">
                    <p className="text-gray-300">
                        By using Universal AI, you agree to the following terms:
                    </p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Universal AI provides AI-powered model comparison services.</li>
                        <li>Paid plans unlock additional features and higher usage limits.</li>
                        <li>Users must not misuse the platform or violate laws.</li>
                        <li>We reserve the right to suspend accounts for abuse or fraud.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Service Availability</h2>
                    <p className="text-gray-300">
                        We do not guarantee uninterrupted service.
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
