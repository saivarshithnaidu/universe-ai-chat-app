import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/privacy-policy(.*)',
    '/terms(.*)',
    '/refund-policy(.*)',
    '/contact(.*)',
    '/share(.*)',
    '/api/share(.*)',
    '/sitemap.xml',
    '/robots.txt',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
    // Create response with security headers
    const response = NextResponse.next();

    // Security Headers - Protection against common attacks
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.openrouter.ai https://api.openai.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev",
        "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);

    // CORS - Restrict in production
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
        response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Admin route protection - verify role from session
    if (isAdminRoute(request)) {
        try {
            const { userId } = await auth();
            if (!userId) {
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Note: Role verification happens in admin API routes and pages
            // Middleware just ensures authentication
        } catch (error) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect all non-public routes
    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
