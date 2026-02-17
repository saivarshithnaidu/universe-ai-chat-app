import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import { AnalyticsListener } from "@/components/AnalyticsListener";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Universal AI",
    default: "Universal AI – Multi Model AI Chat Platform",
  },
  description: "Universal AI lets you compare GPT, Gemini, Claude and open AI models side-by-side in one powerful platform. Experience the future of AI chat.",
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
  authors: [{ name: "Universal AI" }],
  creator: "Universal AI",
  publisher: "Universal AI",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Universal AI – Multi Model AI Chat Platform",
    description: "Compare GPT, Gemini, Claude and open AI models side-by-side in one powerful platform.",
    url: "https://universalai.co.in",
    siteName: "Universal AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Universal AI - Multi Model AI Chat Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal AI – Multi Model AI Chat Platform",
    description: "Compare GPT, Gemini, Claude and open AI models side-by-side in one powerful platform.",
    images: ["/og-image.png"],
    creator: "@universalai",
  },
  verification: {
    google: "google-site-verification-code",
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
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
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
