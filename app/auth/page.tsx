import { SunLogo } from "@/components/auth/sun-logo";
import { AuthForm } from "./auth-form";
import { Suspense } from "react";

export default function AuthPage() {
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
          <Suspense fallback={<div className="w-full max-w-[480px] h-96" />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

