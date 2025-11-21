"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
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
    <section className="relative overflow-hidden bg-linear-to-b from-background to-muted/20 pt-20 pb-24 md:pt-32 md:pb-40">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-balance">
              Focus on what matters most.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              Friday helps you prioritize your daily tasks using proven productivity principles, so you achieve more with less stress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-12 bg-indigo-600 hover:bg-indigo-700">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-lg px-8 h-12"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No credit card required • Free forever</span>
            </div>
          </div>

          {/* Right column - Animated Demo */}
          <div className="relative">
            <div className="bg-card border rounded-2xl shadow-2xl p-6 md:p-8 relative z-10">
              {/* Long task list */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-muted-foreground">All Tasks</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {visibleTasks.length} tasks
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-hidden">
                  {visibleTasks.map((task, index) => (
                    <div
                      key={task}
                      className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm transition-all duration-500 opacity-100"
                      style={{
                        transitionDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="w-4 h-4 rounded border-2 border-muted-foreground/30 shrink-0" />
                      <span className="text-muted-foreground">{task}</span>
                    </div>
                  ))}
                  {visibleTasks.length === 0 && prioritizedTasks.length === 4 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      ✨ Simplified and prioritized
                    </div>
                  )}
                </div>
              </div>

              {/* Divider with arrow */}
              {prioritizedTasks.length > 0 && (
                <div className="flex items-center justify-center my-6">
                  <div className="h-px bg-linear-to-r from-transparent via-border to-transparent w-full" />
                  <div className="absolute bg-indigo-600 text-white rounded-full p-2">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              )}

              {/* Prioritized tasks */}
              {prioritizedTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="text-indigo-600">Today's Focus</span>
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium">
                      {prioritizedTasks.length} / 4
                    </span>
                  </div>
                  <div className="space-y-2">
                    {prioritizedTasks.map((task, index) => (
                      <div
                        key={task}
                        className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-600 rounded-lg text-sm transition-all duration-500 animate-in slide-in-from-top-2"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="w-4 h-4 rounded border-2 border-indigo-600 shrink-0" />
                        <span className="font-medium">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-br from-indigo-100/40 to-blue-100/40 dark:from-indigo-950/20 dark:to-blue-950/20 blur-3xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

