"use client";

import { ArrowRight, CheckCircle2, Sun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const sampleTasks = [
  "Respond to client emails",
  "Update project documentation",
  "Schedule team meeting",
  "Review Q4 budget",
  "Plan marketing campaign",
  "Fix production bug",
  "Call potential investor",
  "Prepare presentation slides",
  "Review team performance",
  "Update website copy",
  "Research competitors",
  "Write blog post",
];

export function HeroSection() {
  const [visibleTasks, setVisibleTasks] = useState(sampleTasks);
  const [prioritizedTasks, setPrioritizedTasks] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after a delay
    const timer = setTimeout(() => {
      setIsAnimating(true);
      
      // Gradually move tasks to prioritized
      const topFourTasks = [
        "Fix production bug",
        "Call potential investor", 
        "Respond to client emails",
        "Prepare presentation slides"
      ];

      topFourTasks.forEach((task, index) => {
        setTimeout(() => {
          setPrioritizedTasks(prev => [...prev, task]);
          setVisibleTasks(prev => prev.filter(t => t !== task));
        }, (index + 1) * 600);
      });

      // Hide remaining tasks
      setTimeout(() => {
        setVisibleTasks([]);
      }, topFourTasks.length * 600 + 500);
      
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 pt-20 pb-24 md:pt-32 md:pb-40">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Content */}
          <div className="max-w-2xl">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <Sun className="w-14 h-14 text-yellow-500" strokeWidth={2} />
              <span className="text-5xl font-bold text-slate-800 dark:text-slate-100">friday</span>
            </div>

            {/* Tagline */}
            <h1 className="text-4xl font-semibold leading-tight mb-4 text-slate-800 dark:text-slate-100">
              Focus on what matters most.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-[600px]">
              Friday helps you prioritize your daily tasks using proven productivity principles, so you achieve more with less stress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto px-8 h-12 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium">
                  Start Focusing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-8 h-12 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No credit card required • Free forever</span>
            </div>
          </div>

          {/* Right column - Animated Demo */}
          <div className="relative">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 md:p-8 relative z-10">
              {/* Long task list */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-slate-600 dark:text-slate-400">All Tasks</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {visibleTasks.length} tasks
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-hidden">
                  {visibleTasks.map((task, index) => (
                    <div
                      key={task}
                      className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm transition-all duration-500 opacity-100"
                      style={{
                        transitionDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{task}</span>
                    </div>
                  ))}
                  {visibleTasks.length === 0 && prioritizedTasks.length === 4 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      ✨ Simplified and prioritized
                    </div>
                  )}
                </div>
              </div>

              {/* Divider with arrow */}
              {prioritizedTasks.length > 0 && (
                <div className="flex items-center justify-center my-6">
                  <div className="h-px bg-linear-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent w-full" />
                  <div className="absolute bg-yellow-500 text-slate-900 rounded-full p-2">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              )}

              {/* Prioritized tasks */}
              {prioritizedTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="text-yellow-600 dark:text-yellow-500">Today's Focus</span>
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium">
                      {prioritizedTasks.length} / 4
                    </span>
                  </div>
                  <div className="space-y-2">
                    {prioritizedTasks.map((task, index) => (
                      <div
                        key={task}
                        className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg text-sm transition-all duration-500 animate-in slide-in-from-top-2"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="w-4 h-4 rounded border-2 border-yellow-600 dark:border-yellow-500 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-100">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-br from-yellow-100/40 to-orange-100/40 dark:from-yellow-950/20 dark:to-orange-950/20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
