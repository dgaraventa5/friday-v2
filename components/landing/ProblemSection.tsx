import { ListX, Brain, Frown } from "lucide-react";

const painPoints = [
  {
    icon: ListX,
    title: "Endless task lists",
    description: "Most to-do lists just pile up tasks without helping you prioritize",
    color: "text-red-500"
  },
  {
    icon: Brain,
    title: "Cognitive overload",
    description: "You end up with cognitive overload and analysis paralysis",
    color: "text-orange-500"
  },
  {
    icon: Frown,
    title: "Productivity becomes a chore",
    description: "Getting organized becomes a chore that makes you *less* productive",
    color: "text-yellow-500"
  }
];

export function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-800">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            Sound familiar?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            You're not alone. Traditional productivity apps make the problem worse.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div 
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 shadow-md card-hover"
              >
                <div className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 ${point.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-100">{point.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
