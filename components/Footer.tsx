'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // Hide footer on app routes (chat interface)
    if (pathname?.startsWith('/app')) {
        return null;
    }

    return (
        <footer className="w-full py-3 border-t border-gray-800 bg-black/80 backdrop-blur-md text-gray-400 text-xs z-40">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/privacy-policy" className="hover:text-white transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="hover:text-white transition-colors">
                        Terms
                    </Link>
                    <Link href="/refund-policy" className="hover:text-white transition-colors">
                        Refund Policy
                    </Link>
                    <Link href="/contact" className="hover:text-white transition-colors">
                        Contact
                    </Link>
                </div>
                <div className="text-gray-600">
                    © {new Date().getFullYear()} Universal AI. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
