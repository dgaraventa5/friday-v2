"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const focusedTasks = [
  "Prepare investor pitch",
  "Fix signup flow bug",
  "Call Dr. Martinez",
  "Review lease agreement",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Sunrise gradient background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFDF7 0%, #fef3c7 38%, #fcd34d 75%, #fb923c 100%)",
        }}
        aria-hidden="true"
      />

      {/* Sun glow rising from bottom */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-64 w-[140%] aspect-square rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, #fffbeb 0%, #fef3c7 30%, #fcd34d 55%, #f59e0b 80%, transparent 95%)",
          boxShadow: "0 0 140px rgba(251, 191, 36, 0.55)",
        }}
        aria-hidden="true"
      />

      {/* Faint horizon line */}
      <div
        className="absolute left-0 right-0 bottom-[36%] h-px pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(120, 53, 15, 0.18) 30%, rgba(120, 53, 15, 0.18) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left column — text */}
          <div>
            <p className="animate-fade-up text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-900/70 mb-7">
              A Daily Focus App
            </p>
            <h1
              className="animate-fade-up font-display text-5xl md:text-7xl font-semibold leading-[0.95] tracking-tight text-slate-900"
              style={{ animationDelay: "100ms", letterSpacing: "-0.035em" }}
            >
              Less today.
            </h1>
            <h1
              className="animate-fade-up font-display text-5xl md:text-7xl font-normal italic leading-[0.95] tracking-tight text-amber-900 mt-1"
              style={{ animationDelay: "200ms", letterSpacing: "-0.035em" }}
            >
              More&nbsp;done.
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-base md:text-lg text-amber-950/90 leading-relaxed"
              style={{ animationDelay: "300ms" }}
            >
              The to-do list that picks your top four for you, every morning —
              using the same matrix Eisenhower built to run a continent.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ animationDelay: "400ms" }}
            >
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="cta-hover w-full sm:w-auto px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
                >
                  Begin Friday
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <a
                href="#three-acts"
                className="text-sm font-medium text-amber-900 underline underline-offset-4 decoration-amber-900/40 hover:decoration-amber-900 transition-colors"
              >
                See how it works ↓
              </a>
            </div>

            <p
              className="animate-fade-up mt-3 text-xs text-amber-950/75 font-medium"
              style={{ animationDelay: "500ms" }}
            >
              Free forever · No card · 60-second setup
            </p>
          </div>

          {/* Right column — product peek */}
          <div
            className="animate-fade-up relative"
            style={{ animationDelay: "350ms" }}
            aria-hidden="true"
          >
            <div
              className="bg-[#FFFDF7] border border-amber-700/25 rounded-2xl p-5 -rotate-2"
              style={{
                boxShadow:
                  "0 20px 60px rgba(120, 53, 15, 0.18), 0 4px 12px rgba(120, 53, 15, 0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">
                  Today&apos;s Focus
                </span>
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  🔥 7
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {focusedTasks.map((task) => (
                  <div
                    key={task}
                    className="bg-amber-100 border-l-[3px] border-yellow-500 px-3 py-2 rounded-md text-sm text-amber-950 font-medium"
                  >
                    {task}
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-slate-400 italic mt-3">
                Prioritized automatically · 4 of 27 tasks
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
