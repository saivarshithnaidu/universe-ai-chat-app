'use client';

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function AnalyticsListener() {
    const { data: session, status } = useSession();
    const hasLoggedLogin = useRef(false);

    useEffect(() => {
        if (status === "authenticated" && session?.user && !hasLoggedLogin.current) {
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'login_success', {
                    method: 'next-auth',
                    user_id: (session.user as any).id,
                    page: 'home'
                });
                hasLoggedLogin.current = true;
            }
        }
    }, [status, session]);

    return null;
}
