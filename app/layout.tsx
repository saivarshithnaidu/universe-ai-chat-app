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
    template: "%s | UniversalAI",
    default: "UniversalAI – AI Chat Platform",
  },
  description: "UniversalAI is an AI-powered chat platform built with Next.js, Clerk authentication, and modern cloud infrastructure.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "UniversalAI – AI Chat Platform",
    description: "UniversalAI is an AI-powered chat platform built with Next.js, Clerk authentication, and modern cloud infrastructure.",
    url: "https://universalsai.co.in",
    siteName: "UniversalAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

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
