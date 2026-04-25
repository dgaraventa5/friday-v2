import { FadeIn } from "./fade-in";

const faqs = [
  {
    q: "How is Friday different from Todoist or Things?",
    a: "Other apps hold your list. Friday picks your top four. We don't add features — we add clarity. If you've ever opened Todoist and felt overwhelmed, that's the gap Friday fills.",
  },
  {
    q: "What if I have more than 4 important tasks?",
    a: "You probably don't. Friday's whole job is helping you accept that. The rest go in the backlog and surface on the day they belong on. This is the discipline.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Free forever for personal use. No card, no upgrade screen, no team plan to upsell you on.",
  },
  {
    q: "What about my data?",
    a: "Stored encrypted on Supabase. We never sell, share, or use your tasks to train anything. No tracking pixels. No analytics on your task content.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-[#FFFDF7] py-16 md:py-24">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-700 mb-3">
              Common Questions
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-slate-900">
              Before you sign up.
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {faqs.map((item, i) => (
              <div
                key={item.q}
                className={
                  i < faqs.length - 1
                    ? "pb-6 border-b"
                    : ""
                }
                style={
                  i < faqs.length - 1
                    ? { borderColor: "rgba(180, 83, 9, 0.15)" }
                    : undefined
                }
              >
                <h3 className="font-display text-lg md:text-xl font-semibold text-slate-900 mb-2">
                  {item.q}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
