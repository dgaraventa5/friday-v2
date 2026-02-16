const painPoints = [
  "Your to-do list keeps growing, but nothing gets done.",
  "You spend more time organizing tasks than actually doing them.",
  "By 3pm, you\u2019re busy but can\u2019t name one important thing you finished.",
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-36">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-16 text-center">
            Sound familiar?
          </h2>

          <div className="space-y-8 md:space-y-10">
            {painPoints.map((point, i) => (
              <p
                key={i}
                className="text-xl md:text-2xl text-slate-600 leading-relaxed flex items-start gap-4"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full bg-yellow-400 mt-3 shrink-0"
                  aria-hidden="true"
                />
                {point}
              </p>
            ))}
          </div>

          <p className="mt-14 md:mt-16 text-center text-lg text-slate-400 italic">
            It&apos;s not a discipline problem. It&apos;s a prioritization
            problem.
          </p>
        </div>
      </div>
    </section>
  );
}
