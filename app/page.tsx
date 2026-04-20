'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Layers, GitCompare, ToggleLeft, Plug, Bot, Zap, FileText, Mail, Database, Cloud, Grid, Figma, Triangle, Slack, Github, Send, Palette } from 'lucide-react';
import { useSession } from "next-auth/react";
import CheckoutButton from '@/components/CheckoutButton';
import Footer from '@/components/Footer';
import { SplineDemo } from '@/components/ui/spline-demo';
import { BackgroundPaths } from '@/components/ui/background-paths';
import Pricing from '@/components/ui/pricing-component';
import NeuralBackground from '@/components/ui/flow-field-background';

// Dynamic import — Three.js uses browser APIs, cannot SSR
const AnomalousMatterHero = dynamic(
  () => import('@/components/ui/anomalous-matter-hero').then(m => ({ default: m.AnomalousMatterHero })),
  { ssr: false, loading: () => <div className="w-full h-screen bg-[#09090b]" /> }
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

export default function LandingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">

      {/* ── NAV ───────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#4facfe] to-[#805ad5] shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-all duration-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L4 5V11C4 16.19 7.41 21.05 12 22C16.59 21.05 20 16.19 20 11V5L12 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-white">
                UniversalAI
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                Premier Hub
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">Sign In</a>
                <a href="/login" className="text-sm font-semibold px-4 py-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
                  Start Free
                </a>
              </>
            ) : (
              <a href="/app" className="text-sm font-semibold px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full hover:scale-105 transition-all">
                Open App
              </a>
            )}
          </div>
        </div>
      </nav>

      <main>

        {/* ── HERO — Three.js Anomalous Matter ────────────────────── */}
        <AnomalousMatterHero>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto px-6 text-center animate-fade-in-long"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold mb-8 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Now with 40+ Connectors
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[88px] font-bold leading-[1.1] tracking-tight mb-8">
              {["ChatGPT,", "Claude,", "Gemini"].map((word, wi) => (
                <span key={wi} className="inline-block mr-4 last:mr-0">
                  {word.split("").map((letter, li) => (
                    <motion.span
                      key={`${wi}-${li}`}
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: wi * 0.1 + li * 0.03, type: "spring", stiffness: 150, damping: 25 }}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
              <br />
              <motion.span
                variants={fadeUp}
                className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-300 to-neutral-600"
              >
                All in One Place
              </motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto mb-12 leading-relaxed">
              Use multiple AI models, compare answers, and build faster in one interface.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all text-sm">
                Start Chat <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/app" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 hover:scale-105 transition-all text-sm backdrop-blur-md">
                Compare Models
              </a>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs text-neutral-600 mt-8">Free to start. No credit card needed.</motion.p>
          </motion.div>
        </AnomalousMatterHero>

        {/* ── DUAL SCROLLING STRIP ──────────────────────── */}
        <div className="relative overflow-hidden w-full border-y border-white/5 bg-[#0a0a0a] py-8 space-y-6 flex flex-col group/strip">
          <div className="absolute inset-y-0 left-0 w-20 md:w-48 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 md:w-48 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

          {/* Row 1 — Models */}
          <div className="flex gap-6 w-max animate-scroll-left group-hover/strip:[animation-play-state:paused]">
            {['GPT-4o', 'Claude', 'Gemini', 'LLaMA', 'Mixtral', 'Phi-3', 'GPT-4o', 'Claude', 'Gemini', 'LLaMA', 'Mixtral', 'Phi-3', 'GPT-4o', 'Claude', 'Gemini', 'LLaMA', 'Mixtral', 'Phi-3'].map((m, i) => (
              <div key={i} className="flex items-center gap-2 px-4 cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                <span className="text-sm font-bold tracking-widest text-neutral-500 hover:text-white transition-colors whitespace-nowrap uppercase">{m}</span>
              </div>
            ))}
          </div>

          {/* Row 2 — Connectors */}
          <div className="flex gap-4 w-max animate-scroll-right group-hover/strip:[animation-play-state:paused]">
            {[
              { n: 'Notion', i: <FileText className="w-4 h-4" /> }, { n: 'Gmail', i: <Mail className="w-4 h-4" /> },
              { n: 'Supabase', i: <Database className="w-4 h-4" /> }, { n: 'Google Drive', i: <Cloud className="w-4 h-4" /> },
              { n: 'Airtable', i: <Grid className="w-4 h-4" /> }, { n: 'Figma', i: <Figma className="w-4 h-4" /> },
              { n: 'Vercel', i: <Triangle className="w-4 h-4" /> }, { n: 'Slack', i: <Slack className="w-4 h-4" /> },
              { n: 'GitHub', i: <Github className="w-4 h-4" /> }, { n: 'Zapier', i: <Zap className="w-4 h-4" /> },
              { n: 'Postman', i: <Send className="w-4 h-4" /> }, { n: 'Canva', i: <Palette className="w-4 h-4" /> },
              { n: 'Notion', i: <FileText className="w-4 h-4" /> }, { n: 'Gmail', i: <Mail className="w-4 h-4" /> },
              { n: 'Supabase', i: <Database className="w-4 h-4" /> }, { n: 'Google Drive', i: <Cloud className="w-4 h-4" /> },
              { n: 'Airtable', i: <Grid className="w-4 h-4" /> }, { n: 'Figma', i: <Figma className="w-4 h-4" /> },
              { n: 'Vercel', i: <Triangle className="w-4 h-4" /> }, { n: 'Slack', i: <Slack className="w-4 h-4" /> },
              { n: 'GitHub', i: <Github className="w-4 h-4" /> }, { n: 'Zapier', i: <Zap className="w-4 h-4" /> },
              { n: 'Postman', i: <Send className="w-4 h-4" /> }, { n: 'Canva', i: <Palette className="w-4 h-4" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 cursor-default transition-all whitespace-nowrap">
                <span className="text-neutral-500">{item.i}</span>{item.n}
              </div>
            ))}
          </div>
        </div>

        {/* ── SPLINE PREVIEW ────────────────────────────── */}
        <SplineDemo />

        {/* ── FEATURES ──────────────────────────────────── */}
        <section id="features" className="relative w-full py-24 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6 z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-semibold mb-5">Built for modern AI workflows</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3 text-white">Everything you need</h2>
              <p className="text-neutral-500 text-lg">One app. All AI tools. No switching, no friction.</p>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
              {[
                { title: 'One Chat, Multiple AI', desc: 'Use different AI models in one chat automatically.', icon: <Layers className="w-6 h-6 text-purple-400" />, accent: 'hover:border-purple-500/30 hover:shadow-purple-500/10', iconBg: 'bg-purple-500/10 border-purple-500/20' },
                { title: 'Compare Mode', desc: 'See multiple answers side by side instantly.', icon: <GitCompare className="w-6 h-6 text-blue-400" />, accent: 'hover:border-blue-500/30 hover:shadow-blue-500/10', iconBg: 'bg-blue-500/10 border-blue-500/20' },
                { title: 'Switch Models Anytime', desc: 'Change your AI model mid-conversation fluidly.', icon: <ToggleLeft className="w-6 h-6 text-cyan-400" />, accent: 'hover:border-cyan-500/30 hover:shadow-cyan-500/10', iconBg: 'bg-cyan-500/10 border-cyan-500/20' },
                { title: '40+ Connectors', desc: 'Connect Notion, Gmail, databases & more.', icon: <Plug className="w-6 h-6 text-pink-400" />, accent: 'hover:border-pink-500/30 hover:shadow-pink-500/10', iconBg: 'bg-pink-500/10 border-pink-500/20' },
                { title: 'AI Agent', desc: 'Generate full projects and write code autonomously.', icon: <Bot className="w-6 h-6 text-violet-400" />, accent: 'hover:border-violet-500/30 hover:shadow-violet-500/10', iconBg: 'bg-violet-500/10 border-violet-500/20' },
                { title: 'Fast & Simple', desc: 'No switching between apps. Extremely clean UI.', icon: <Zap className="w-6 h-6 text-amber-400" />, accent: 'hover:border-amber-500/30 hover:shadow-amber-500/10', iconBg: 'bg-amber-500/10 border-amber-500/20' },
              ].map(({ title, desc, icon, accent, iconBg }) => (
                <motion.div key={title} variants={fadeUp}
                  className={`relative group rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${accent} cursor-default overflow-hidden`}
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${iconBg}`}>{icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed group-hover:text-neutral-400 transition-colors">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <section className="relative border-y border-white/5 py-24 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-bold mb-20 text-white">
              How it works
            </motion.h2>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative flex flex-col sm:flex-row items-start justify-between max-w-3xl mx-auto gap-12 sm:gap-0"
            >
              <div className="absolute top-6 left-[16%] right-[16%] hidden sm:block h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              {[
                { step: '1', title: 'Sign up', desc: 'Create your free account in seconds' },
                { step: '2', title: 'Choose AI', desc: 'Pick one model or compare multiple' },
                { step: '3', title: 'Start chatting', desc: 'Use tools, compare, and build' },
              ].map(({ step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="relative z-10 flex flex-col items-center flex-1 group">
                  <div className="w-12 h-12 rounded-full border border-white/15 bg-[#0a0a0a] flex items-center justify-center text-lg font-bold mb-4 text-white shadow-[0_0_20px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] group-hover:border-purple-500 transition-all duration-300">
                    {step}
                  </div>
                  <h3 className="font-bold text-base text-neutral-200 group-hover:text-white transition-colors mb-1">{title}</h3>
                  <p className="text-xs text-neutral-600 max-w-[110px] text-center leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────── */}
        <section id="pricing" className="relative w-full overflow-hidden">
          <div className="relative z-10 w-full">
            <Pricing />
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section className="relative w-full py-24 overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-6 z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {[
                  { q: 'What is UniversalAI?', a: 'UniversalAI is a single app where you can chat with multiple premium AI models like ChatGPT, Claude, and Gemini — all in one unified place. No need to open different websites or switch tabs.' },
                  { q: 'Do I need multiple subscriptions?', a: 'No. One UniversalAI account gives you access to all available top-tier models without needing to manage separate subscriptions for OpenAI, Anthropic, or Google.' },
                  { q: 'Which AI models are available?', a: 'You get access to GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro, along with open-source models like LLaMA 3, Mixtral, and Phi-3.' },
                  { q: 'Is it free to start?', a: 'Yes! The Free plan lets you start with essential models and basic features. Pro unlocks premium models, unlimited chats, all 40+ connectors, and the full AI Agent.' },
                  { q: 'How does compare mode work?', a: 'Compare Mode lets you send a single prompt to 2–3 AI models simultaneously. Answers stream side-by-side so you can pick the best response or verify facts.' },
                ].map(({ q, a }, idx) => (
                  <motion.details key={idx}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07 }}
                    className="group bg-white/[0.03] border border-white/8 rounded-2xl px-6 py-5 cursor-pointer hover:border-white/15 transition-colors"
                  >
                    <summary className="list-none flex items-center justify-between font-semibold text-base text-white select-none">
                      {q}
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-open:rotate-180 transition-transform duration-300 ml-4 flex-shrink-0 border border-white/8">
                        <span className="text-neutral-500 text-xs">▾</span>
                      </div>
                    </summary>
                    <p className="mt-4 text-sm text-neutral-400 leading-relaxed">{a}</p>
                  </motion.details>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative bg-[#09090b] border border-white/10 rounded-[2rem] px-8 py-20 flex flex-col items-center justify-center overflow-hidden shadow-2xl"
          >
            {/* Animated Flow Field inside CTA */}
            <NeuralBackground color="#8b5cf6" trailOpacity={0.1} speed={1.2} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-20 text-center">
              <h2 className="text-4xl md:text-6xl font-black mb-5 text-white tracking-tight">
                All AI. One place.<br />Start now.
              </h2>
              <p className="text-white/60 mb-10 text-lg max-w-md mx-auto">
                Join thousands of builders accelerating their work with UniversalAI.
              </p>
              <a href="/login" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] text-base">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
