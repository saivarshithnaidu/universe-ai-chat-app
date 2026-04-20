import React from "react";

export const metadata = {
    title: "Contact Us – UniversalAI",
};

export default function Contact() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold mb-8">Contact Us – UniversalAI</h1>

                <section className="space-y-4">
                    <p className="text-gray-300">
                        For support, billing issues, or queries:
                    </p>

                    <div className="flex flex-col space-y-2 text-gray-300">
                        <div>
                            <span className="font-semibold">Email: </span>
                            <a href="mailto:support@universalai.co.in" className="text-blue-400 hover:underline">support@universalai.co.in</a>
                        </div>
                        <div>
                            <span className="font-semibold">Website: </span>
                            <a href="https://www.universalai.co.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                https://www.universalai.co.in
                            </a>
                        </div>
                        <div>
                            <span className="font-semibold">Response time: </span>
                            24–48 hours
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
