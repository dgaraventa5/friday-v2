"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SunLogo } from "@/components/auth/sun-logo";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for OAuth error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      router.push("/auth/auth-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    const supabase = createClient();
    setIsOAuthLoading(provider);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#FAF8F5" }}>
      <div className="w-full max-w-[600px]">
        <div className="flex flex-col items-center gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <SunLogo size={56} />
              <span className="text-5xl font-bold" style={{ color: "#1F2937" }}>
                friday
              </span>
            </div>
            <h1 className="text-4xl font-semibold" style={{ color: "#1F2937" }}>
              Focus on what matters most.
            </h1>
          </div>

          {/* Auth form */}
          <div className="w-full max-w-[480px] flex flex-col gap-6">
            <p className="text-center text-base" style={{ color: "#6B7280" }}>
              Enter your email address to get started
            </p>

            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <Input
                id="email"
                type="email"
                placeholder="name@yourcompany.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 text-base rounded-xl border-2"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E7EB",
                  color: "#1F2937",
                }}
              />
              {error && (
                <p className="text-sm text-center" style={{ color: "#DC2626" }}>
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 text-base font-medium rounded-xl"
                style={{
                  backgroundColor: "#D97706",
                  color: "#FFFFFF",
                }}
              >
                {isLoading ? "Sending link..." : "Continue with Email"}
              </Button>
            </form>

            {/* OR divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#D1D5DB" }}></div>
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
                OR
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#D1D5DB" }}></div>
            </div>

            {/* OAuth buttons */}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={isOAuthLoading !== null}
                variant="outline"
                className="h-12 text-base font-medium rounded-xl border-2 flex items-center justify-center gap-3"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E7EB",
                  color: "#1F2937",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
                    fill="#34A853"
                  />
                  <path
                    d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
                    fill="#FBBC04"
                  />
                  <path
                    d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z"
                    fill="#EA4335"
                  />
                </svg>
                {isOAuthLoading === "google" ? "Connecting..." : "Continue with Google"}
              </Button>
            </div>

            {/* Legal footer */}
            <p className="text-xs text-center leading-relaxed mt-2" style={{ color: "#9CA3AF" }}>
              By continuing, you agree to Friday&apos;s{" "}
              <a href="#" className="underline" style={{ color: "#6B7280" }}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline" style={{ color: "#6B7280" }}>
                Privacy Policy
              </a>
              , and acknowledge their{" "}
              <a href="#" className="underline" style={{ color: "#6B7280" }}>
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

