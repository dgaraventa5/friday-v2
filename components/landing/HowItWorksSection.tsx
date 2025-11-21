import { Plus, Sparkles, Target, PartyPopper } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Plus,
    title: "Add your tasks",
    description: "Quick input: name, category, importance, urgency",
    color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
  },
  {
    number: 2,
    icon: Sparkles,
    title: "Friday prioritizes automatically",
    description: "Using the Eisenhower Matrix algorithm",
    color: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400"
  },
  {
    number: 3,
    icon: Target,
    title: "See your top 4 tasks",
    description: "Your daily focus, automatically selected",
    color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
  },
  {
    number: 4,
    icon: PartyPopper,
    title: "Complete and celebrate",
    description: "Check off tasks and see what's next",
    color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white dark:bg-slate-800">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            How it works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            From task overload to focused productivity in 4 simple steps
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLastInRow = (index + 1) % 2 === 0;
              const isNotLastStep = index < steps.length - 1;
              
              return (
                <div key={step.number} className="relative">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-md card-hover h-full">
                    {/* Step number badge */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${step.color}`}>
                        {step.number}
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connection arrow - only show on desktop between steps */}
                  {isNotLastStep && (
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 z-10">
                      {!isLastInRow ? (
                        // Horizontal arrow to the right
                        <div className="absolute left-full ml-4 lg:ml-6">
                          <div className="w-8 lg:w-12 h-0.5 bg-linear-to-r from-yellow-300 to-yellow-500 dark:from-yellow-700 dark:to-yellow-500" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-yellow-500 border-y-4 border-y-transparent" />
                        </div>
                      ) : (
                        // Diagonal arrow down-left
                        <div className="absolute left-1/2 top-full mt-4 -translate-x-1/2">
                          <div className="w-0.5 h-8 bg-linear-to-b from-yellow-300 to-yellow-500 dark:from-yellow-700 dark:to-yellow-500" />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-4 border-t-yellow-500 border-x-4 border-x-transparent" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
