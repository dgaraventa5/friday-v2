import { Plus, Sparkles, Target, PartyPopper } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Plus,
    title: "Add your tasks",
    description: "Quick input: name, category, importance, urgency",
    color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
  },
  {
    number: 2,
    icon: Sparkles,
    title: "Friday prioritizes automatically",
    description: "Using the Eisenhower Matrix algorithm",
    color: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
  },
  {
    number: 3,
    icon: Target,
    title: "See your top 4 tasks",
    description: "Your daily focus, automatically selected",
    color: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
  },
  {
    number: 4,
    icon: PartyPopper,
    title: "Complete and celebrate",
    description: "Check off tasks and see what's next",
    color: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400"
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground">
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
                  <div className="bg-card rounded-2xl p-6 md:p-8 border shadow-sm hover:shadow-md transition-shadow h-full">
                    {/* Step number badge */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${step.color}`}>
                        {step.number}
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connection arrow - only show on desktop between steps */}
                  {isNotLastStep && (
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 z-10">
                      {!isLastInRow ? (
                        // Horizontal arrow to the right
                        <div className="absolute left-full ml-4 lg:ml-6">
                          <div className="w-8 lg:w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-500 dark:from-indigo-700 dark:to-indigo-500" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-indigo-500 border-y-4 border-y-transparent" />
                        </div>
                      ) : (
                        // Diagonal arrow down-left
                        <div className="absolute left-1/2 top-full mt-4 -translate-x-1/2">
                          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-300 to-indigo-500 dark:from-indigo-700 dark:to-indigo-500" />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-4 border-t-indigo-500 border-x-4 border-x-transparent" />
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

