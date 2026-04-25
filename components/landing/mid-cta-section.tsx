import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

export function MidCtaSection() {
  return (
    <section
      className="bg-[#FFFDF7] border-t"
      style={{ borderColor: "rgba(180, 83, 9, 0.1)" }}
    >
      <div className="container mx-auto px-6 py-12 md:py-16">
        <FadeIn>
          <div className="text-center">
            <p className="font-display italic text-2xl md:text-3xl font-medium text-slate-900 mb-6">
              Want this for your tomorrow?
            </p>
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="cta-hover px-6 h-12 bg-slate-900 hover:bg-slate-800 text-amber-100 font-medium"
                >
                  Begin Friday
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <span className="text-xs text-slate-500">
                60-second setup, free forever
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
