import { FadeIn } from "./FadeIn";

/* ----- Act 1 Visual: Add Task Form ----- */
function AddTaskVisual() {
  return (
    <div className="hover-tilt bg-white rounded-2xl shadow-lg shadow-amber-900/[0.04] p-6 border border-slate-100 max-w-sm mx-auto">
      <div className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
        New Task
      </div>
      <div className="space-y-3.5">
        <div className="h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
          <span className="text-sm text-slate-700">Prepare investor pitch</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">Work</span>
          </div>
          <div className="h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
            <span className="text-sm text-slate-500">Due tomorrow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-700 font-medium">Important</span>
          </div>
          <div className="flex-1 h-11 bg-amber-50/80 rounded-xl border border-amber-100 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-amber-700 font-medium">Urgent</span>
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
    <div className="hover-tilt max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 mb-1">CRITICAL</div>
          <div className="text-[11px] text-red-400 mb-3">
            Urgent + Important
          </div>
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

        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-amber-600 mb-1">DELEGATE</div>
          <div className="text-[11px] text-amber-400 mb-3">
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

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 mb-1">ELIMINATE</div>
          <div className="text-[11px] text-slate-300 mb-3">Neither</div>
          <div className="space-y-1.5">
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-400">
              Busy work
            </div>
            <div className="text-xs bg-white/70 rounded-lg px-2.5 py-1.5 text-slate-400">
              Time wasters
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
          &rarr; Your top 4, surfaced automatically
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
    <div className="hover-tilt bg-white rounded-2xl shadow-lg shadow-amber-900/[0.04] p-6 border border-slate-100 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span className="font-semibold text-slate-800">
          Today&apos;s Focus
        </span>
        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
          <span className="text-sm leading-none">&#x1F525;</span>
          <span className="text-xs font-bold text-orange-600">7</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-amber-50/50 border-l-[3px] border-yellow-400 rounded-xl"
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
    title: "Get it off your mind",
    description:
      "Add a task with a name, a category, and two simple questions: is it important? Is it urgent? That\u2019s it. If it\u2019s weighing on you, Friday holds it so you don\u2019t have to.",
    Visual: AddTaskVisual,
    reverse: false,
  },
  {
    step: "02",
    title: "Let Friday sort the noise",
    description:
      "Behind the scenes, Friday scores every task using the Eisenhower Matrix \u2014 the same framework used by world-class leaders for decades. It weighs importance, urgency, and deadline pressure to find what truly needs your attention.",
    Visual: MatrixVisual,
    reverse: true,
  },
  {
    step: "03",
    title: "Wake up knowing what to do",
    description:
      "Each morning, your top tasks are waiting \u2014 chosen for you based on what matters most. No decision fatigue. No guilt about what you\u2019re not doing. Just a clear, calm starting point.",
    Visual: TodaysFocusVisual,
    reverse: false,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-36 bg-white">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-20 md:mb-28">
            <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-4">
              Simple by design
            </h2>
            <p className="text-lg text-slate-500">
              Getting organized shouldn&apos;t be another chore.
            </p>
          </div>
        </FadeIn>

        <div className="space-y-24 md:space-y-32 max-w-5xl mx-auto">
          {acts.map((act, index) => (
            <FadeIn key={act.step} delay={index * 100}>
              <div
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  act.reverse ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Text */}
                <div className={act.reverse ? "lg:col-start-2" : ""}>
                  <div className="text-sm font-semibold text-yellow-600 mb-3 tracking-wide">
                    STEP {act.step}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4">
                    {act.title}
                  </h3>
                  <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                    {act.description}
                  </p>
                </div>

                {/* Visual */}
                <div
                  className={
                    act.reverse ? "lg:col-start-1 lg:row-start-1" : ""
                  }
                >
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
