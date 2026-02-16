import { FadeIn } from "./FadeIn";

export function TrustSignalSection() {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-6">
        <FadeIn>
          <blockquote className="max-w-xl mx-auto text-center flex flex-col items-center gap-3">
            <div
              className="text-5xl leading-none font-serif text-amber-200 select-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <p className="text-lg md:text-xl italic text-slate-500 leading-relaxed">
              What is important is seldom urgent, and what is urgent is seldom
              important.
            </p>
            <footer className="text-xs font-semibold tracking-widest uppercase text-slate-300">
              Dwight D. Eisenhower
            </footer>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  );
}
