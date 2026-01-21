'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function AnalyticsListener() {
    const { isSignedIn, user } = useUser();
    const hasLoggedLogin = useRef(false);

    useEffect(() => {
        if (isSignedIn && user && !hasLoggedLogin.current) {
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'login_success', {
                    method: 'clerk',
                    page: 'home'
                });
                hasLoggedLogin.current = true;
            }
        }
    }, [isSignedIn, user]);

    return null;
}
