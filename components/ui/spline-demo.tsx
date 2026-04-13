'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { ArrowRight } from "lucide-react"

export function SplineDemo() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left content */}
        <div className="relative z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6 w-fit">
            Interactive Preview
          </div>

          <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            All AI. <br />
            One Interface.
          </h2>
          <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
            Use ChatGPT, Claude, Gemini and more in one place. Switch models, compare answers, and use tools — no need to open multiple apps.
          </p>

          <a
            href="/login"
            className="mt-8 inline-flex items-center gap-2 w-fit px-8 py-4 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-lg"
          >
            Try Now <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Right content - Robot Image / Spline */}
        <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-xl">
          <div className="absolute inset-0 w-full h-full">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
