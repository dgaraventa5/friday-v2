import Link from "next/link";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { EisenhowerMatrixSection } from "@/components/landing/EisenhowerMatrixSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">friday</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="hidden sm:inline-flex text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <ValuePropsSection />
        <HowItWorksSection />
        <SocialProofSection />
        <EisenhowerMatrixSection />
        <FinalCTASection />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-12 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">friday</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                Focus on what matters most. Prioritize your daily tasks using proven productivity principles.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-800 dark:text-slate-100">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/auth/sign-up" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-800 dark:text-slate-100">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Friday. Focus on what matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
