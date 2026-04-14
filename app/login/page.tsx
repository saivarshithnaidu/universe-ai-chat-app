'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Github, Chrome, Disc, ChevronLeft, Zap, Shield, MessageSquare } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

function LoginContent() {
    const { status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = "/app";
    const [isLoading, setIsLoading] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated") {
            router.push(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleLogin = async (provider: string) => {
        setIsLoading(provider);
        try {
            await signIn(provider, { callbackUrl });
        } catch (error) {
            console.error("Login failed:", error);
            setIsLoading(null);
        }
    };

    if (status === "authenticated") return null;

    return (
        <>
            {/* Login Card */}
            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/10 rotate-3 transform hover:rotate-0 transition-transform duration-500 overflow-hidden border border-white/10">
                        <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Welcome Back</h1>
                    <p className="text-zinc-400 text-lg">Compare GPT, Gemini & Claude sidy-by-side.</p>
                </div>

                <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[2rem] pointer-events-none" />
                    
                    <div className="space-y-4 relative">
                        {/* Google Button */}
                        <button
                            onClick={() => handleLogin('google')}
                            disabled={!!isLoading}
                            className={clsx(
                                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-300",
                                "bg-white text-[#0B0B0B] hover:bg-zinc-200 active:scale-[0.98]",
                                isLoading === 'google' && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            <Chrome size={20} />
                            {isLoading === 'google' ? "Connecting..." : "Continue with Google"}
                        </button>

                        {/* GitHub Button */}
                        <button
                            onClick={() => handleLogin('github')}
                            disabled={!!isLoading}
                            className={clsx(
                                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-300",
                                "bg-[#24292e] text-white hover:bg-[#2f363d] active:scale-[0.98] border border-white/5",
                                isLoading === 'github' && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            <Github size={20} />
                            {isLoading === 'github' ? "Connecting..." : "Continue with GitHub"}
                        </button>

                         {/* Discord Button */}
                         <button
                            onClick={() => handleLogin('discord')}
                            disabled={!!isLoading}
                            className={clsx(
                                "w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition-all duration-300",
                                "bg-[#5865F2] text-white hover:bg-[#4752C4] active:scale-[0.98]",
                                isLoading === 'discord' && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            <Disc size={20} />
                            {isLoading === 'discord' ? "Connecting..." : "Continue with Discord"}
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <Shield className="w-5 h-5 text-blue-400" />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Secure SSL</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <Zap className="w-5 h-5 text-purple-400" />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Instant Access</span>
                        </div>
                      </div>
                    </div>
                </div>

                <p className="mt-10 text-center text-zinc-500 text-sm">
                    By continuing, you agree to our <Link href="/terms" className="text-zinc-300 underline underline-offset-4 hover:text-white transition-colors">Terms of Service</Link> and <Link href="/privacy-policy" className="text-zinc-300 underline underline-offset-4 hover:text-white transition-colors">Privacy Policy</Link>.
                </p>
            </div>
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Back Button */}
            <div className="absolute top-8 left-8 z-20">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-medium"
              >
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                  <ChevronLeft size={16} />
                </div>
                Back home
              </Link>
            </div>

            <Suspense fallback={<div className="text-white opacity-50 flex items-center gap-2"><Zap className="animate-spin" size={20} /> Loading authentication...</div>}>
                <LoginContent />
            </Suspense>

            {/* Footer Features */}
            <div className="mt-20 flex gap-8 z-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center gap-2 text-zinc-400">
                    <MessageSquare size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Compare AI</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                    <Zap size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Fast Response</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                    <Shield size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Privacy First</span>
                </div>
            </div>
        </div>
    );
}
