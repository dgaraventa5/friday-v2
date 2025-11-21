import { Target, FolderKanban, Sparkles } from "lucide-react";

const valueProps = [
  {
    id: "prioritize",
    icon: Target,
    title: "Prioritize like a world-class executor",
    points: [
      "Rooted in the Eisenhower Matrix—the same prioritization method used by presidents and top executives",
      "Our algorithm automatically surfaces your top 4 tasks each day based on importance, urgency, and due dates",
      "You'll only see what matters today. Everything else is out of sight, out of mind."
    ],
    visual: "matrix",
    imagePosition: "right"
  },
  {
    id: "organize",
    icon: FolderKanban,
    title: "Organize all your tasks - all in one place",
    points: [
      "Track work, personal, health, and life tasks without mental overload",
      "Balance your life by setting daily limits per category",
      "Create, edit, and manage recurring tasks with minimal steps"
    ],
    visual: "categories",
    imagePosition: "left"
  },
  {
    id: "streamlined",
    icon: Sparkles,
    title: "A streamlined app to simplify your life",
    points: [
      "Clean, distraction-free interface strips away complexity",
      "No overwhelming features—just simple task creation and smart prioritization",
      "Focus on doing, not organizing"
    ],
    visual: "interface",
    imagePosition: "right"
  }
];

const MatrixVisual = () => (
  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-4">
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {/* Q1 - Critical */}
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-500 rounded-lg p-4 transition-transform hover:scale-105">
        <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Q1: CRITICAL</div>
        <div className="text-xs text-red-600 dark:text-red-400 mb-1">Urgent + Important</div>
        <div className="mt-2 space-y-1">
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Fix production bug</div>
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Client deadline</div>
        </div>
      </div>

      {/* Q2 - Plan */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500 rounded-lg p-4 transition-transform hover:scale-105">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Q2: PLAN</div>
        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Important, Not Urgent</div>
        <div className="mt-2 space-y-1">
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Plan Q2 strategy</div>
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Learn new skill</div>
        </div>
      </div>

      {/* Q3 - Urgent */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 rounded-lg p-4 transition-transform hover:scale-105">
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Q3: URGENT</div>
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Urgent, Not Important</div>
        <div className="mt-2 space-y-1">
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Meeting request</div>
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Email responses</div>
        </div>
      </div>

      {/* Q4 - Backlog */}
      <div className="bg-slate-50 dark:bg-slate-950/30 border-2 border-slate-400 rounded-lg p-4 transition-transform hover:scale-105">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-400 mb-2">Q4: BACKLOG</div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Neither Urgent nor Important</div>
        <div className="mt-2 space-y-1">
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Busy work</div>
          <div className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 text-slate-700 dark:text-slate-300">Time wasters</div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-xs px-4 py-2 rounded-full shadow-lg whitespace-nowrap font-medium">
      → Your Top 4 Tasks
    </div>
  </div>
);

const CategoriesVisual = () => (
  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-6">
    <div className="space-y-4 w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
            💼 Work
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">3/4 today</span>
        </div>
        <div className="space-y-2">
          <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300">Review proposals</div>
          <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300">Team standup</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
            🏠 Personal
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">1/2 today</span>
        </div>
        <div className="space-y-2">
          <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300">Grocery shopping</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 font-medium">
            ❤️ Health
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">0/1 today</span>
        </div>
        <div className="space-y-2">
          <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded text-slate-500 dark:text-slate-400">Morning workout</div>
        </div>
      </div>
    </div>
  </div>
);

const InterfaceVisual = () => (
  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-6">
    <div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-sm">F</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">Friday</span>
        </div>
        {/* Streak indicator */}
        <div className="flex items-center gap-1 bg-linear-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
          <span className="text-base">🔥</span>
          <span className="text-xs font-bold text-orange-500">7</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-16 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm flex items-center px-4">
          <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 mr-3" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2" />
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
        <div className="h-16 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm flex items-center px-4">
          <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 mr-3" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
          </div>
        </div>
        <div className="h-16 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm flex items-center px-4">
          <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 mr-3" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2 mb-2" />
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-300 dark:border-slate-600 text-center">
        <div className="text-xs text-slate-600 dark:text-slate-400">Clean. Simple. Focused.</div>
      </div>
    </div>
  </div>
);

export function ValuePropsSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            How Friday is different
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Built for people who want to achieve more without the overwhelm
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            const isReversed = prop.imagePosition === "left";
            
            return (
              <div 
                key={prop.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isReversed ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Text content */}
                <div className={isReversed ? 'lg:col-start-2' : ''}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 mb-6">
                    <Icon className="h-8 w-8 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                    {prop.title}
                  </h3>
                  <ul className="space-y-4">
                    {prop.points.map((point, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className={isReversed ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    {prop.visual === "matrix" && <MatrixVisual />}
                    {prop.visual === "categories" && <CategoriesVisual />}
                    {prop.visual === "interface" && <InterfaceVisual />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
