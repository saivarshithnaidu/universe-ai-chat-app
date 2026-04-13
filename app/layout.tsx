import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnalyticsListener } from "@/components/AnalyticsListener";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Universe AI",
    default: "Universe AI – Compare GPT-4o, Claude 3.5 & Gemini Pro Side-by-Side",
  },
  description: "Universe AI lets you compare GPT, Gemini, Claude and open AI models side-by-side in one powerful platform. Experience the future of AI chat.",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: [
    "AI Chat",
    "GPT Comparison",
    "Claude AI",
    "Gemini AI",
    "Multi Model AI Platform",
    "SaaS AI",
    "AI Assistant",
    "OpenAI",
    "Artificial Intelligence"
  ],
  authors: [{ name: "Universe AI" }],
  creator: "Universe AI",
  publisher: "Universe AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Universe AI – Multi Model AI Chat Platform",
    description: "Compare GPT, Gemini, Claude and open AI models side-by-side in one powerful platform.",
    url: "https://universeai.dev",
    siteName: "Universe AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Universe AI - Multi Model AI Chat Platform",
      },
    ],
  },
  alternates: {
    canonical: "https://universeai.dev",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap"
            rel="stylesheet"
          />
          <Script
            id="razorpay-checkout-js"
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="beforeInteractive"
          />
        </head>
        <body className="antialiased bg-zinc-950 text-zinc-50 min-h-screen">
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-16JVGT9WRQ"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-16JVGT9WRQ');
            `}
          </Script>
          <AnalyticsListener />
          {children}
        </body>
      </html>
    </Providers>
  );
}
