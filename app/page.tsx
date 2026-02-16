import Link from "next/link";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSignalSection } from "@/components/landing/TrustSignalSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#FFFDF7]/90 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
            <span className="text-xl font-bold text-slate-800">friday</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-slate-600 hover:bg-amber-50"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="cta-hover bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />

        {/* Gradient divider: Hero → HowItWorks */}
        <div
          className="h-px mx-auto max-w-3xl bg-gradient-to-r from-transparent via-amber-200/60 to-transparent"
          aria-hidden="true"
        />

        <HowItWorksSection />
        <TrustSignalSection />
        <FinalCTASection />
      </main>

      {/* Subtle noise/grain texture overlay */}
      <svg className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.03]" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Footer */}
      <footer className="border-t border-amber-100 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
                <span className="text-xl font-bold text-slate-800">friday</span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Focus on what matters most. Prioritize your daily tasks using
                proven productivity principles.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-700">
                Product
              </h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="hover:text-slate-800 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-700">
                Company
              </h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#"
                    className="hover:text-slate-800 transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-amber-100 text-center">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Friday. Focus on what matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
