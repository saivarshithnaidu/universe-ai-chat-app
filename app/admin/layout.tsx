import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';
import { LayoutDashboard, Users, AlertCircle, LifeBuoy } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await isAdmin();

    if (!admin) {
        redirect('/app');
    }

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white">
            {/* Admin Navigation */}
            <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-bold">Admin Panel</h1>
                            <div className="flex gap-4">
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                    Users
                                </Link>
                                <Link
                                    href="/admin/errors"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Errors
                                </Link>
                                <Link
                                    href="/admin/support"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <LifeBuoy className="w-4 h-4" />
                                    Support
                                </Link>
                            </div>
                        </div>
                        <Link
                            href="/app"
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Back to App
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    );
}
