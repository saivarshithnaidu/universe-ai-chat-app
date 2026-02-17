'use client';

import { ArrowRight, Zap, Shield, BarChart3, Check, Sparkles } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#0B0B0B] text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">Universal AI</span>
            </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <a
                  href="/sign-in"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
                >
                  Start Free
                </a>
              </SignedOut>
              <SignedIn>
                <a
                  href="/app"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Open App
                </a>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Compare AI Models<br />Side-by-Side
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
            Universal AI lets you compare GPT, Gemini, Claude and open AI models in one powerful platform. Get the best answer, every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/sign-up"
              className="px-8 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all font-semibold text-lg flex items-center gap-2 shadow-xl hover:shadow-2xl"
            >
              Start Free Now <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl hover:bg-white/10 transition-all font-semibold text-lg border border-white/10"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-zinc-600 mt-6">No credit card required • Free to start</p>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why Choose Universal AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Multi-Model Comparison</h3>
              <p className="text-zinc-400">
                Compare responses from GPT-4, Claude, Gemini, and more open-source models simultaneously. Find the best answer for your needs.
              </p>
            </article>

            <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-zinc-400">
                Get instant responses from multiple AI models with optimized performance and smart fallback systems.
              </p>
            </article>

            <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Secure & Private</h3>
              <p className="text-zinc-400">
                Your conversations are encrypted and secure. We respect your privacy with enterprise-grade security.
              </p>
            </article>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white/5">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up Free</h3>
              <p className="text-zinc-400">Create your account in seconds. No credit card required to start.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Select Models</h3>
              <p className="text-zinc-400">Choose up to 3 AI models to compare side-by-side.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Best Answers</h3>
              <p className="text-zinc-400">Compare responses and choose the best answer for your needs.</p>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-zinc-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>3 AI models comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Basic models (Gemini, LLaMA, Mixtral)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Chat history</span>
                </li>
              </ul>
              <a
                href="/sign-up"
                className="block w-full text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-semibold border border-white/10"
              >
                Get Started
              </a>
            </article>

            <article className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-2xl p-8 relative">
              <div className="absolute -top-4 right-8 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-2xl font-semibold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-6">$9<span className="text-lg text-zinc-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>All free features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Premium models (GPT-4, Claude)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Unlimited conversations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Priority support</span>
                </li>
              </ul>
              <a
                href="/sign-up"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-xl"
              >
                Upgrade Now
              </a>
            </article>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                What AI models are available?
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-zinc-400 mt-4">
                We support GPT-4, Claude 3.5, Gemini Pro, LLaMA 3.1, Mixtral, and Phi-3. Free users get access to open-source models, while premium users unlock GPT-4 and Claude.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                How does the comparison work?
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-zinc-400 mt-4">
                Select up to 3 models, ask your question, and see all responses side-by-side. This helps you compare quality, speed, and accuracy to find the best answer.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                Is my data secure?
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-zinc-400 mt-4">
                Yes! All conversations are encrypted and stored securely. We use industry-standard security practices and never share your data with third parties.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                Can I cancel anytime?
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-zinc-400 mt-4">
                Absolutely! You can upgrade, downgrade, or cancel your subscription at any time. No questions asked.
              </p>
            </details>

            <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                Do you offer refunds?
                <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-zinc-400 mt-4">
                Yes! We offer a 7-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </details>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Experience the Future of AI?
            </h2>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users comparing AI models to get better answers, faster.
            </p>
            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all font-semibold text-lg shadow-xl"
            >
              Start Free Today <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
