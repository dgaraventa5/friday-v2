"use client";

import { SunLogo } from "@/components/auth/sun-logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#FAF8F5" }}>
      <div className="w-full max-w-[600px]">
        <div className="flex flex-col items-center gap-8">
          {/* Logo and brand */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <SunLogo size={56} />
              <span className="text-5xl font-bold" style={{ color: "#1F2937" }}>
                friday
              </span>
            </div>
          </div>

          {/* Success message */}
          <div className="w-full max-w-[480px] flex flex-col gap-6 items-center text-center">
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-semibold" style={{ color: "#1F2937" }}>
                Check your email
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "#6B7280" }}>
                We&apos;ve sent you a magic link to sign in. Click the link in your email to continue to Friday.
              </p>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                The link will expire in 1 hour for security reasons.
              </p>
            </div>

            {/* Decorative mail icon */}
            <div className="my-4">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="10"
                  y="20"
                  width="60"
                  height="40"
                  rx="4"
                  stroke="#FDE047"
                  strokeWidth="2"
                  fill="#FEF9C3"
                />
                <path
                  d="M10 24L40 44L70 24"
                  stroke="#FDE047"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full mt-4">
              <Link href="/auth" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-xl border-2"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E7EB",
                    color: "#1F2937",
                  }}
                >
                  Back to sign in
                </Button>
              </Link>
            </div>

            {/* Help text */}
            <p className="text-sm mt-4" style={{ color: "#9CA3AF" }}>
              Didn&apos;t receive an email? Check your spam folder or try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

