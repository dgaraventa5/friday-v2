import { FadeIn } from "./fade-in";

/* ----- Act 1 Visual: Add Task Form ----- */
function AddTaskVisual() {
  return (
    <div
      className="hover-tilt bg-[#FFFDF7] rounded-2xl p-6 max-w-sm"
      style={{
        border: "1px solid rgba(180, 83, 9, 0.2)",
        boxShadow: "0 8px 30px rgba(120, 53, 15, 0.08)",
      }}
    >
      <div className="text-xs font-semibold text-amber-700 mb-4 uppercase tracking-wider">
        New Task
      </div>
      <div className="space-y-3.5">
        <div className="h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center px-4">
          <span className="text-sm text-slate-700">Prepare investor pitch</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">Work</span>
          </div>
          <div className="h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center justify-center">
            <span className="text-sm text-amber-800">Due tomorrow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-700 font-medium">Important</span>
          </div>
          <div className="flex-1 h-11 bg-amber-100 rounded-xl border border-amber-200 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm text-amber-800 font-medium">Urgent</span>
          </div>
        </div>
        <div className="h-11 bg-yellow-400 rounded-xl flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-900">Add Task</span>
        </div>
      </div>
    </div>
  );
}

/* ----- Act 2 Visual: Eisenhower Matrix ----- */
function MatrixVisual() {
  return (
    <div className="hover-tilt max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 mb-1">CRITICAL</div>
          <div className="text-[11px] text-red-400 mb-3">Urgent + Important</div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Fix prod bug
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Client deadline
            </div>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-blue-600 mb-1">PLAN</div>
          <div className="text-[11px] text-blue-400 mb-3">
            Important, Not Urgent
          </div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Q2 strategy
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Learn new skill
            </div>
          </div>
        </div>

        <div className="bg-amber-100/80 border border-amber-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-amber-700 mb-1">DELEGATE</div>
          <div className="text-[11px] text-amber-500 mb-3">
            Urgent, Not Important
          </div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Meeting request
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-600">
              Email replies
            </div>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-stone-500 mb-1">BACKLOG</div>
          <div className="text-[11px] text-stone-400 mb-3">Neither</div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-stone-500">
              Busy work
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-stone-500">
              Time wasters
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          → Your top 4, surfaced automatically
        </span>
      </div>
    </div>
  );
}

/* ----- Act 3 Visual: Today's Focus ----- */
function TodaysFocusVisual() {
  const tasks = [
    {
      name: "Prepare investor pitch",
      category: "Work",
      categoryClasses: "bg-blue-50 text-blue-600",
    },
    {
      name: "Fix signup flow bug",
      category: "Work",
      categoryClasses: "bg-blue-50 text-blue-600",
    },
    {
      name: "Call Dr. Martinez",
      category: "Health",
      categoryClasses: "bg-rose-50 text-rose-600",
    },
    {
      name: "Review lease agreement",
      category: "Personal",
      categoryClasses: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div
      className="hover-tilt bg-[#FFFDF7] rounded-2xl p-6 max-w-sm"
      style={{
        border: "1px solid rgba(180, 83, 9, 0.2)",
        boxShadow: "0 8px 30px rgba(120, 53, 15, 0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-slate-800">Today&apos;s Focus</span>
        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
          <span className="text-sm leading-none">&#x1F525;</span>
          <span className="text-xs font-bold text-orange-600">7</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-amber-50/70 border-l-[3px] border-yellow-500 rounded-xl"
          >
            <div className="w-4 h-4 rounded border-2 border-yellow-500 shrink-0" />
            <span className="flex-1 text-sm font-medium text-slate-700 min-w-0 truncate">
              {task.name}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${task.categoryClasses}`}
            >
              {task.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----- Section ----- */

const acts = [
  {
    step: "01",
    title: "Empty your head.",
    description:
      "Drop tasks in as they come. One field, two simple questions: is it important? Is it urgent? Friday holds the rest so you don't have to.",
    Visual: AddTaskVisual,
  },
  {
    step: "02",
    title: "Friday sorts the noise.",
    description:
      "Behind the scenes, every task is scored using the Eisenhower Matrix — importance, urgency, and deadline pressure, all weighed for you.",
    Visual: MatrixVisual,
  },
  {
    step: "03",
    title: "Wake up to four things.",
    description:
      "Each morning your top four are waiting — chosen for you based on what matters most. No decision fatigue. No guilt about the rest. A clear, calm starting point.",
    Visual: TodaysFocusVisual,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="three-acts"
      className="py-20 md:py-28"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #fed7aa 0%, #fef3c7 30%, #FFFDF7 100%)",
      }}
    >
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-16 md:mb-20">
            <p className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-700 mb-4">
              Three Acts
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-slate-900 leading-tight">
              Friday is built around{" "}
              <em className="font-normal text-amber-900">
                one daily ritual.
              </em>
            </h2>
          </div>
        </FadeIn>

        <div className="max-w-5xl mx-auto">
          {acts.map((act, index) => (
            <FadeIn key={act.step} delay={index * 100}>
              <div
                className="grid lg:grid-cols-[80px_1fr_minmax(0,360px)] gap-6 lg:gap-12 items-center py-10 lg:py-14"
                style={{
                  borderTop: "1px solid rgba(120, 53, 15, 0.15)",
                  borderBottom:
                    index === acts.length - 1
                      ? "1px solid rgba(120, 53, 15, 0.15)"
                      : undefined,
                }}
              >
                {/* Chapter number */}
                <div className="font-display italic font-normal text-4xl md:text-5xl text-amber-700">
                  {act.step}
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
                    {act.title}
                  </h3>
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-lg">
                    {act.description}
                  </p>
                </div>

                {/* Visual */}
                <div className="lg:justify-self-end">
                  <act.Visual />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
