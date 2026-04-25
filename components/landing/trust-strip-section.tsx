const pills = [
  "No AI gimmicks",
  "No bloat",
  "No upsells",
  "No tracking",
  "Just clarity",
];

export function TrustStripSection() {
  return (
    <section
      className="bg-amber-50 border-y"
      style={{ borderColor: "rgba(180, 83, 9, 0.1)" }}
    >
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {pills.map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-amber-900"
            >
              <span className="text-yellow-600" aria-hidden="true">
                ✦
              </span>
              <span>{pill}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] md:text-xs italic text-amber-800/85 mt-4">
          Hand-built solo — because every other to-do list got it wrong.
        </p>
      </div>
    </section>
  );
}
