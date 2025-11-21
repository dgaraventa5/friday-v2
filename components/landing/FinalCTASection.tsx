"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FinalCTASection() {
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      setIsValidEmail(true);
      // Redirect to sign up with email pre-filled
      window.location.href = `/auth/sign-up?email=${encodeURIComponent(email)}`;
    } else {
      setIsValidEmail(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-linear-to-br from-yellow-500 to-orange-500 text-slate-900">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ready to reduce your stress and accomplish what matters?
          </h2>
          <p className="text-lg md:text-xl text-slate-800 mb-10">
            Join thousands of people who are focusing on their top priorities
          </p>

          {/* Email signup form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsValidEmail(true);
                    }}
                    className={`pl-10 h-12 bg-white text-slate-900 placeholder:text-slate-500 border-slate-300 ${
                      !isValidEmail ? 'border-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {!isValidEmail && (
                  <p className="text-xs text-red-700 mt-1 text-left">Please enter a valid email address</p>
                )}
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 whitespace-nowrap font-medium"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>

          {/* Alternative: Sign up with Google */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-slate-800/30" />
              <span className="text-sm text-slate-800">or</span>
              <div className="flex-1 h-px bg-slate-800/30" />
            </div>
            <Link href="/auth/sign-up">
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/90 border-slate-300 text-slate-900 hover:bg-white h-12 px-8 font-medium"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Start with Google
              </Button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Free forever</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Takes 60 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
