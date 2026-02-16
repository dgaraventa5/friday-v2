"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const allTasks = [
  "Respond to client emails",
  "Update project docs",
  "Schedule team meeting",
  "Review Q4 budget",
  "Fix production bug",
  "Call potential investor",
  "Prepare presentation",
  "Research competitors",
];

const focusedTasks = [
  "Fix production bug",
  "Call potential investor",
  "Respond to client emails",
  "Prepare presentation",
];

type Phase = "all" | "transitioning" | "focused" | "resetting";

const PHASE_DURATIONS: Record<Phase, number> = {
  all: 3000,
  transitioning: 2000,
  focused: 3000,
  resetting: 1200,
};

const NEXT_PHASE: Record<Phase, Phase> = {
  all: "transitioning",
  transitioning: "focused",
  focused: "resetting",
  resetting: "all",
};

export function HeroSection() {
  const [phase, setPhase] = useState<Phase>("all");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const timer = setTimeout(() => {
      setPhase(NEXT_PHASE[phase]);
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  const showAll = phase === "all" || phase === "resetting";
  const showFocused = phase === "transitioning" || phase === "focused";

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-40">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column — Content */}
          <div className="max-w-xl">
            <h1 className="animate-fade-up text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-slate-900">
              The to-do list that{" "}
              <span className="text-yellow-600">thinks&nbsp;for&nbsp;you.</span>
            </h1>

            <p
              className="animate-fade-up text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-[540px]"
              style={{ animationDelay: "150ms" }}
            >
              Add your tasks. Friday&apos;s prioritization engine surfaces what
              matters most each day, so nothing important slips through.
            </p>

            <div
              className="animate-fade-up flex flex-col sm:flex-row gap-4 mb-6"
              style={{ animationDelay: "300ms" }}
            >
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="cta-hover w-full sm:w-auto px-8 h-12 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
                >
                  Start Focusing
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 h-12 border-slate-200 text-slate-600 hover:bg-white"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </div>

          </div>

          {/* Right column — Looping animation */}
          <div
            className="animate-fade-up relative"
            style={{ animationDelay: "500ms" }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/[0.04] p-6 md:p-8 relative z-10 overflow-hidden">
              {/* Both layers stacked in same grid cell */}
              <div className="grid [&>div]:col-start-1 [&>div]:row-start-1">
                {/* All Tasks layer */}
                <div
                  className="transition-all duration-[1200ms] ease-in-out"
                  style={{
                    opacity: showAll ? 1 : 0,
                    filter: showAll ? "blur(0px)" : "blur(6px)",
                  }}
                  aria-hidden={!showAll}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-400 text-sm tracking-wide">
                      Your Tasks
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 font-medium">
                      {allTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {allTasks.map((task) => (
                      <div
                        key={task}
                        className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl text-sm"
                      >
                        <div className="w-4 h-4 rounded border-2 border-slate-200 shrink-0" />
                        <span className="text-slate-500">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Focused Tasks layer */}
                <div
                  className="transition-all duration-[1200ms] ease-in-out"
                  style={{
                    opacity: showFocused ? 1 : 0,
                    transform: showFocused
                      ? "translateY(0)"
                      : "translateY(8px)",
                  }}
                  aria-hidden={!showFocused}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-amber-700 text-sm tracking-wide">
                      Today&apos;s Focus
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                      4 tasks
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {focusedTasks.map((task, i) => (
                      <div
                        key={task}
                        className="flex items-center gap-3 p-3.5 bg-amber-50/60 border-l-[3px] border-yellow-400 rounded-xl text-sm transition-all duration-700 ease-out"
                        style={{
                          transitionDelay: showFocused
                            ? `${i * 120}ms`
                            : "0ms",
                          opacity: showFocused ? 1 : 0,
                          transform: showFocused
                            ? "translateX(0)"
                            : "translateX(-12px)",
                        }}
                      >
                        <div className="w-4 h-4 rounded border-2 border-yellow-500 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-center text-xs text-slate-400 tracking-wide">
                    Prioritized automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Warm decorative glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-gradient-to-br from-yellow-100/50 to-amber-100/30 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
