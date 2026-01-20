'use client';

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";

export default function Page() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0B] p-4 text-center">

            {/* Logo/Icon (Optional - small brand mark above) */}
            <div className="mb-6 flex items-center justify-center">
                <div className="relative w-10 h-10">
                    <Image
                        src="/icon.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>

            <div className="w-full max-w-[400px] flex flex-col gap-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white/90">Welcome back</h1>
                    {/* <p className="text-sm text-zinc-500">Enter your details to sign in.</p> */}
                </div>

                <div className="bg-[#121212] border border-white/5 rounded-2xl p-2 shadow-2xl">
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        appearance={{
                            baseTheme: dark,
                            layout: {
                                socialButtonsPlacement: "bottom",
                                showOptionalFields: false,
                            },
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none p-6 w-full",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                formButtonPrimary: "bg-white text-zinc-900 hover:bg-zinc-200 !shadow-none !border-none h-10 text-sm font-medium",
                                socialButtonsBlockButton: "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white h-10 text-sm",
                                socialButtonsBlockButtonText: "font-medium",
                                dividerLine: "bg-white/10",
                                dividerText: "text-zinc-600 text-[11px] uppercase tracking-wider font-medium",
                                formFieldInput: "bg-[#0B0B0B] border border-white/10 focus:border-white/20 text-white h-10 rounded-lg",
                                formFieldLabel: "text-zinc-400 text-xs font-medium mb-1.5",
                                footerActionLink: "text-blue-400 hover:text-blue-300",
                                identityPreviewText: "text-zinc-300",
                                formFieldAction: "text-blue-400 hover:text-blue-300"
                            }
                        }}
                    />
                </div>
            </div>

            {/* Footer links (Optional) */}
            <div className="mt-8 text-xs text-zinc-600 flex gap-4">
                <a href="/terms" className="hover:text-zinc-400 transition-colors">Terms</a>
                <a href="/privacy-policy" className="hover:text-zinc-400 transition-colors">Privacy</a>
            </div>
        </div>
    );
}
