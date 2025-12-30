'use client';

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";

export default function Page() {
    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-black">
            <div className="flex w-full flex-col md:flex-row">
                {/* Left Column (Desktop) / Top (Mobile) - Welcome Image */}
                <div className="flex flex-1 items-center justify-center p-8 bg-black">
                    <Image
                        src="/welcome-image.png"
                        alt="Welcome to Universal AI"
                        width={600}
                        height={600}
                        priority
                        className="object-contain max-w-full h-auto"
                        unoptimized // Added safety for local development issues
                    />
                </div>

                {/* Right Column (Desktop) / Bottom (Mobile) - Clerk Form */}
                <div className="flex flex-1 items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/20">
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        appearance={{
                            baseTheme: dark
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
