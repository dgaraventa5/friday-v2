import Link from "next/link";
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-semibold">Friday</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
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
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-xl font-semibold">Friday</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Focus on what matters most. Prioritize your daily tasks using proven productivity principles.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Get Started</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/#" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Friday. Focus on what matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
