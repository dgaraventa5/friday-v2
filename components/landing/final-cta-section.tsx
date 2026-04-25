import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

export function FinalCTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Sunrise gradient (mirrors the hero) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFDF7 0%, #fef3c7 30%, #fcd34d 65%, #fb923c 100%)",
        }}
        aria-hidden="true"
      />

      {/* Sun glow */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-72 w-[140%] aspect-square rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, #fffbeb 0%, #fef3c7 30%, #fcd34d 55%, #f59e0b 80%, transparent 95%)",
          boxShadow: "0 0 140px rgba(251, 191, 36, 0.6)",
        }}
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="font-display text-4xl md:text-6xl font-semibold leading-[0.95] tracking-tight text-slate-900"
              style={{ letterSpacing: "-0.03em" }}
            >
              It&apos;s Friday.
            </h2>
            <h2
              className="font-display text-4xl md:text-6xl font-normal italic leading-[0.95] tracking-tight text-amber-900 mt-1"
              style={{ letterSpacing: "-0.03em" }}
            >
              Lighten the load.
            </h2>

            <Link href="/auth/sign-up" className="inline-block mt-8">
              <Button
                size="lg"
                className="cta-hover px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
              >
                Begin Friday
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <p className="mt-3 text-xs text-amber-950/80 font-medium">
              Free forever · No card · 60-second setup
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
