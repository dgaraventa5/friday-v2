import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";

export function FinalCTASection() {
  return (
    <section className="py-24 md:py-36 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Ready to focus on what actually matters?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-10">
              Let Friday figure out what to tackle first.
            </p>

            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="cta-hover px-10 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-base"
              >
                Get started for free
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
