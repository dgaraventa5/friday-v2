"use client";

import { useState } from "react";
import { AlertCircle, Calendar, Users, Trash2 } from "lucide-react";

const quadrants = [
  {
    id: "q1",
    label: "Q1: Do First",
    title: "Urgent + Important",
    color: "red",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-500",
    textClass: "text-red-700 dark:text-red-400",
    icon: AlertCircle,
    examples: [
      "Production system down",
      "Client deadline today",
      "Medical emergency"
    ],
    description: "Critical tasks requiring immediate attention. These should be done first."
  },
  {
    id: "q2",
    label: "Q2: Schedule",
    title: "Important, Not Urgent",
    color: "green",
    bgClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-500",
    textClass: "text-green-700 dark:text-green-400",
    icon: Calendar,
    examples: [
      "Strategic planning",
      "Learning & development",
      "Building relationships"
    ],
    description: "Important long-term goals. Schedule time for these to prevent them from becoming urgent."
  },
  {
    id: "q3",
    label: "Q3: Delegate",
    title: "Urgent, Not Important",
    color: "yellow",
    bgClass: "bg-yellow-50 dark:bg-yellow-950/30",
    borderClass: "border-yellow-500",
    textClass: "text-yellow-700 dark:text-yellow-400",
    icon: Users,
    examples: [
      "Some emails and calls",
      "Certain meetings",
      "Minor interruptions"
    ],
    description: "Urgent but not contributing to your goals. Delegate when possible."
  },
  {
    id: "q4",
    label: "Q4: Eliminate",
    title: "Neither Urgent nor Important",
    color: "gray",
    bgClass: "bg-gray-50 dark:bg-gray-950/30",
    borderClass: "border-gray-400",
    textClass: "text-gray-700 dark:text-gray-400",
    icon: Trash2,
    examples: [
      "Mindless scrolling",
      "Busy work",
      "Time wasters"
    ],
    description: "Low-value activities. Consider eliminating these entirely."
  }
];

export function EisenhowerMatrixSection() {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Built on a proven framework
          </h2>
          <p className="text-lg text-muted-foreground mb-2">
            Friday uses the Eisenhower Matrix, the prioritization method used by presidents, CEOs, and top performers
          </p>
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-indigo-600 pl-4 mt-6 max-w-2xl mx-auto text-left">
            "What is important is seldom urgent, and what is urgent is seldom important."
            <footer className="text-xs mt-2 not-italic">— Dwight D. Eisenhower</footer>
          </blockquote>
        </div>

        {/* Matrix Grid */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {quadrants.map((quadrant) => {
              const Icon = quadrant.icon;
              const isHovered = hoveredQuadrant === quadrant.id;
              
              return (
                <div
                  key={quadrant.id}
                  className={`
                    ${quadrant.bgClass} 
                    border-2 ${quadrant.borderClass}
                    rounded-2xl p-6 md:p-8
                    transition-all duration-300 cursor-pointer
                    ${isHovered ? 'scale-105 shadow-xl' : 'shadow-sm hover:shadow-lg'}
                  `}
                  onMouseEnter={() => setHoveredQuadrant(quadrant.id)}
                  onMouseLeave={() => setHoveredQuadrant(null)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`h-6 w-6 ${quadrant.textClass}`} />
                    <div>
                      <div className={`text-xs font-bold ${quadrant.textClass} mb-1`}>
                        {quadrant.label}
                      </div>
                      <div className={`text-sm font-semibold ${quadrant.textClass}`}>
                        {quadrant.title}
                      </div>
                    </div>
                  </div>

                  <p className={`text-sm ${quadrant.textClass} mb-4 leading-relaxed`}>
                    {quadrant.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Examples:
                    </div>
                    {quadrant.examples.map((example, i) => (
                      <div 
                        key={i}
                        className="text-xs p-2 bg-white/50 dark:bg-black/20 rounded backdrop-blur-sm"
                      >
                        • {example}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How Friday uses this */}
          <div className="bg-card rounded-2xl border shadow-lg p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/30 mb-4">
              <div className="text-2xl">🎯</div>
            </div>
            <h3 className="text-xl font-bold mb-3">
              How Friday uses this framework
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              When you add tasks, you mark them as <span className="font-semibold">important</span> or <span className="font-semibold">urgent</span>. 
              Friday's algorithm automatically categorizes them into the right quadrant and prioritizes your top 4 tasks each day, 
              focusing on Q1 (Do First) and Q2 (Schedule) items that drive real results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

