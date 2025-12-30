'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
    const router = useRouter();

    const deleteData = async () => {
        if (!confirm("Are you sure? This will permanently delete all your chat history.")) return;

        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' });
            if (res.ok) {
                alert("Data deleted.");
                router.push('/');
            } else {
                alert("Failed to delete data.");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting data");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 space-y-8 dark:text-gray-200 text-gray-800">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

            <section>
                <h2 className="text-xl font-bold mb-2">1. Data Collection</h2>
                <p>We log messages for the sole purpose of providing AI responses. We also track basic usage statistics (message counts) to prevent abuse.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-2">2. Data Usage</h2>
                <p>Your data is used to generate responses via third-party AI providers (Google, OpenRouter). We do not share your personal data with advertisers.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-2">3. Data Deletion</h2>
                <p className="mb-4">You have full control over your data. You can permanently delete your account's chat history at any time.</p>

                <button
                    onClick={deleteData}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Delete My Data
                </button>
            </section>
        </div>
    );
}
