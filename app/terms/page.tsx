import type { Metadata } from "next";
import Link from "next/link";
import { Sun } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Friday",
  description:
    "The terms you agree to when using Friday, the task management app.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF7]">
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-[#FFFDF7]/90 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sun className="w-8 h-8 text-yellow-500" strokeWidth={2} />
            <span className="text-xl font-bold text-slate-800">friday</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <Link href="/auth/login" className="hover:text-slate-900 transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-6 py-16">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500">Last updated: April 16, 2026</p>
          </header>

          <div className="space-y-6 text-[15px] leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_li]:leading-relaxed [&_a]:text-amber-700 [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-semibold [&_strong]:text-slate-900 [&_code]:rounded [&_code]:bg-amber-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-amber-900">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access
              to and use of Friday (&ldquo;Friday,&rdquo; the
              &ldquo;Service&rdquo;), a task management application operated
              by Dom Garaventa (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) at{" "}
              <a href="https://getfriday.vercel.app">getfriday.vercel.app</a>.
              By creating an account, signing in, or otherwise using the
              Service, you agree to be bound by these Terms. If you do not
              agree, do not use the Service.
            </p>

            <h2>1. Who can use Friday</h2>
            <p>
              You must be at least 13 years old (or the minimum age required
              in your jurisdiction) to use Friday. By using the Service, you
              represent that you meet this age requirement and that you have
              the legal capacity to agree to these Terms.
            </p>

            <h2>2. Your account</h2>
            <p>
              To use most features of Friday, you create an account using an
              email and password, or by signing in with a supported
              third-party provider. You are responsible for:
            </p>
            <ul>
              <li>Providing accurate information when you sign up.</li>
              <li>Keeping your password confidential and your account secure.</li>
              <li>
                All activity that occurs under your account, whether or not
                authorized by you.
              </li>
            </ul>
            <p>
              If you believe your account has been compromised, contact us
              immediately at{" "}
              <a href="mailto:dgaraventa5@gmail.com">dgaraventa5@gmail.com</a>.
            </p>

            <h2>3. What Friday does</h2>
            <p>
              Friday is a task management application that helps you organize
              tasks by urgency and importance, automatically schedules them
              based on capacity limits you set, and surfaces your top daily
              priorities. Optionally, you can connect a Google Calendar to
              display your events alongside your tasks (read-only access).
              Features and functionality may change over time.
            </p>

            <h2>4. Acceptable use</h2>
            <p>When using Friday, you agree <strong>not</strong> to:</p>
            <ul>
              <li>
                Use the Service for any unlawful purpose, or to store or
                transmit unlawful content.
              </li>
              <li>
                Attempt to gain unauthorized access to other users&rsquo;
                accounts, data, or any part of the Service you are not
                permitted to access.
              </li>
              <li>
                Interfere with, disrupt, or overload the Service, its
                infrastructure, or the networks and systems it depends on.
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract source
                code from any part of the Service, except to the extent such
                restrictions are prohibited by law.
              </li>
              <li>
                Use automated means (bots, scrapers, crawlers) to access the
                Service in a way that exceeds typical human use, without our
                prior written consent.
              </li>
              <li>
                Resell, sublicense, or otherwise commercially exploit the
                Service without our prior written consent.
              </li>
            </ul>

            <h2>5. Your content</h2>
            <p>
              Friday lets you create tasks, reminders, and other content
              (&ldquo;Your Content&rdquo;). You retain full ownership of Your
              Content. By storing Your Content on Friday, you grant us a
              limited, non-exclusive license to host, transmit, process, and
              display it solely for the purpose of providing the Service to
              you. We do not claim ownership of Your Content, and we do not
              sell it, use it to train machine learning models, or share it
              with third parties except the service providers required to run
              Friday (see our{" "}
              <Link href="/privacy">Privacy Policy</Link>).
            </p>

            <h2>6. Third-party services</h2>
            <p>
              Friday integrates with third-party services including Supabase
              (database and authentication), Vercel (application hosting),
              and Google (optional OAuth sign-in and Google Calendar
              integration). Your use of these integrations may also be
              governed by the third parties&rsquo; own terms and privacy
              policies. We are not responsible for the content, policies, or
              practices of any third-party service.
            </p>
            <p>
              If you connect a Google Calendar, you authorize Friday to make
              read-only API calls to Google Calendar on your behalf. You can
              disconnect the calendar at any time from Friday&rsquo;s
              Settings page, or revoke access directly at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                myaccount.google.com/permissions
              </a>
              .
            </p>

            <h2>7. Fees</h2>
            <p>
              Friday is currently offered free of charge. If we introduce
              paid features in the future, we will notify you before any
              charges apply and give you the choice to accept or decline
              them.
            </p>

            <h2>8. Intellectual property</h2>
            <p>
              Friday, including its name, logo, user interface, code,
              documentation, and underlying technology, is owned by Dom
              Garaventa and protected by applicable intellectual property
              laws. Subject to your compliance with these Terms, we grant you
              a limited, non-exclusive, non-transferable, revocable license
              to access and use the Service for your personal or internal
              business use. These Terms do not grant you any rights to our
              trademarks, trade names, or brand features.
            </p>

            <h2>9. Termination</h2>
            <p>
              You may stop using Friday at any time. You can delete your
              account by emailing us at{" "}
              <a href="mailto:dgaraventa5@gmail.com">dgaraventa5@gmail.com</a>
              . We may suspend or terminate your access to the Service if
              you violate these Terms, if we are required to do so by law,
              or if continuing to provide the Service to you creates a
              material risk to us or other users. On termination, your right
              to use the Service ends, and we may delete Your Content in
              accordance with our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h2>10. Disclaimers</h2>
            <p>
              Friday is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
              <strong>&ldquo;as available&rdquo;</strong>, without warranties
              of any kind, whether express, implied, statutory, or otherwise.
              To the fullest extent permitted by law, we disclaim all
              warranties, including warranties of merchantability, fitness
              for a particular purpose, non-infringement, and any warranty
              arising out of course of dealing or usage of trade. We do not
              warrant that the Service will be uninterrupted, error-free,
              secure, or free of viruses or other harmful components, or
              that any defects will be corrected. Friday is not a substitute
              for professional, medical, legal, or financial advice.
            </p>

            <h2>11. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, in no event will Dom
              Garaventa, Friday, or their affiliates, officers, employees, or
              agents be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits,
              revenue, data, use, goodwill, or other intangible losses,
              arising out of or relating to your use of (or inability to use)
              the Service, whether based in contract, tort, strict liability,
              or any other theory.
            </p>
            <p>
              Our aggregate liability for any claim arising out of or
              relating to these Terms or the Service will not exceed the
              greater of (a) the amount you paid us for the Service in the
              twelve months preceding the event giving rise to the claim, or
              (b) one hundred US dollars ($100).
            </p>

            <h2>12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Dom
              Garaventa and Friday from any claims, damages, liabilities,
              losses, and expenses (including reasonable attorneys&rsquo;
              fees) arising out of or related to: (a) your use of the
              Service; (b) Your Content; or (c) your violation of these
              Terms or any applicable law.
            </p>

            <h2>13. Changes to the Service or these Terms</h2>
            <p>
              We may modify, suspend, or discontinue the Service (or any
              part of it) at any time. We may also update these Terms from
              time to time. If we make material changes, we will notify you
              by email or through the Service. Your continued use of Friday
              after the updated Terms take effect constitutes acceptance of
              the revised Terms. The &ldquo;Last updated&rdquo; date at the
              top of this page reflects the latest revision.
            </p>

            <h2>14. Governing law and disputes</h2>
            <p>
              These Terms are governed by the laws of the State of
              California, USA, without regard to its conflict of laws rules.
              Any dispute arising out of or relating to these Terms or the
              Service will be resolved in the state or federal courts
              located in California, and you consent to the personal
              jurisdiction of those courts. Nothing in this section prevents
              either party from seeking injunctive or other equitable
              relief.
            </p>

            <h2>15. Miscellaneous</h2>
            <p>
              These Terms, together with our{" "}
              <Link href="/privacy">Privacy Policy</Link>, are the entire
              agreement between you and us regarding the Service. If any
              provision of these Terms is held to be unenforceable, the
              remaining provisions will remain in full force and effect. Our
              failure to enforce any right or provision of these Terms is
              not a waiver of that right or provision. You may not assign
              these Terms without our prior written consent; we may assign
              them freely.
            </p>

            <h2>16. Contact</h2>
            <p>
              Questions about these Terms? Email us at{" "}
              <a href="mailto:dgaraventa5@gmail.com">dgaraventa5@gmail.com</a>.
            </p>
          </div>
        </article>
      </main>

      <footer className="border-t border-amber-100 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Friday. Focus on what matters.
          </p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-800 transition-colors">
              Terms
            </Link>
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
