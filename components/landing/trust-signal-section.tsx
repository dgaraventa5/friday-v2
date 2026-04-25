import { FadeIn } from "./fade-in";

export function TrustSignalSection() {
  return (
    <section
      className="py-16 md:py-20"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #fb923c 0%, #fdba74 30%, #fed7aa 100%)",
      }}
    >
      <div className="container mx-auto px-6">
        <FadeIn>
          <blockquote className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
            <div className="font-display italic text-[11px] md:text-xs tracking-[0.3em] uppercase text-amber-900/70">
              — A Note from 1954 —
            </div>
            <p className="font-display text-2xl md:text-3xl italic font-normal leading-snug text-amber-950">
              &ldquo;What is important is seldom urgent, and what is urgent is
              seldom important.&rdquo;
            </p>
            <footer className="text-[11px] md:text-xs font-bold tracking-[0.32em] uppercase text-amber-900">
              Dwight D. Eisenhower
            </footer>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  );
}
