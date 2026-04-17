import type { Metadata } from "next";
import Link from "next/link";
import { Sun } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Friday",
  description:
    "How Friday collects, uses, stores, and shares your data, including Google user data.",
};

export default function PrivacyPolicyPage() {
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
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms
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
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last updated: April 16, 2026
            </p>
          </header>

          <div className="space-y-6 text-[15px] leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_li]:leading-relaxed [&_a]:text-amber-700 [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-semibold [&_strong]:text-slate-900 [&_code]:rounded [&_code]:bg-amber-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-amber-900">
            <p>
              This Privacy Policy explains how Friday (&ldquo;Friday,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
              uses, stores, and shares information when you use our task
              management application at{" "}
              <a href="https://getfriday.vercel.app">getfriday.vercel.app</a> (the
              &ldquo;Service&rdquo;). By using the Service, you agree to the
              practices described here.
            </p>

            <h2>1. Who we are</h2>
            <p>
              Friday is operated by Dom Garaventa, based in
              California, USA. If you have questions
              about this policy or your data, contact us at{" "}
              <a href="mailto:dgaraventa5@gmail.com">dgaraventa5@gmail.com</a>.
            </p>

            <h2>2. Information we collect</h2>

            <h3>2.1 Account information</h3>
            <p>
              When you create an account, we collect your email address and a
              hashed password (managed by our authentication provider, Supabase).
              If you sign in with Google, we collect your Google account email
              address and a unique Google account identifier.
            </p>

            <h3>2.2 Content you create in Friday</h3>
            <ul>
              <li>
                <strong>Tasks:</strong> titles, descriptions, due dates, start
                dates, importance/urgency classifications, categories (Work,
                Home, Health, Personal), estimated hours, and completion status.
              </li>
              <li>
                <strong>Reminders:</strong> reminder text and schedule metadata.
              </li>
              <li>
                <strong>Profile preferences:</strong> daily task limits,
                per-category hour limits, streak history (current streak,
                longest streak, last completion date), and onboarding status.
              </li>
            </ul>

            <h3>2.3 Google user data (if you connect Google Calendar)</h3>
            <p>
              Connecting a Google Calendar is optional. If you choose to
              connect one, we request the following OAuth scopes from Google:
            </p>
            <ul>
              <li>
                <code>https://www.googleapis.com/auth/calendar.readonly</code>{" "}
                — read-only access to your Google Calendar events.
              </li>
              <li>
                <code>https://www.googleapis.com/auth/userinfo.email</code> —
                your Google account email address, used to label the connected
                calendar.
              </li>
            </ul>
            <p>With these scopes, we access and store:</p>
            <ul>
              <li>
                <strong>OAuth tokens:</strong> your Google access token and
                refresh token, so Friday can fetch calendar events on your
                behalf without asking you to sign in repeatedly.
              </li>
              <li>
                <strong>Calendar metadata:</strong> your Google account email,
                the calendar ID you selected, and the calendar&rsquo;s display
                name and color.
              </li>
              <li>
                <strong>Cached calendar events:</strong> event title,
                description, start time, end time, all-day flag, status
                (busy/free/tentative), location, and the link back to Google
                Calendar. This cache exists so Friday can display your calendar
                alongside your tasks quickly without making a Google API
                request on every page load.
              </li>
            </ul>
            <p>
              <strong>We do not create, modify, or delete events in your Google
              Calendar.</strong> The scope we request is read-only.
            </p>

            <h3>2.4 Technical information</h3>
            <p>
              Like most web applications, we automatically receive basic
              technical information when you use the Service, including IP
              address, browser type, and pages visited. This is used for
              security, fraud prevention, and debugging.
            </p>

            <h2>3. How we use your information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and maintain the Service.</li>
              <li>
                Run Friday&rsquo;s task prioritization, scheduling, and streak
                tracking features on the tasks and preferences you&rsquo;ve
                provided.
              </li>
              <li>
                Display your Google Calendar events alongside your scheduled
                tasks, so you can see conflicts between meetings and planned
                work.
              </li>
              <li>Authenticate you and keep your account secure.</li>
              <li>Diagnose technical problems and improve reliability.</li>
              <li>
                Communicate with you about your account or material changes to
                the Service.
              </li>
            </ul>

            <h2>4. Google API Services User Data Policy &mdash; Limited Use</h2>
            <p>
              Friday&rsquo;s use and transfer of information received from
              Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Specifically:
            </p>
            <ul>
              <li>
                We only use Google user data to provide and improve
                user-facing features of Friday that are prominent in the
                application&rsquo;s user interface.
              </li>
              <li>
                We do not use Google user data to serve advertising, and we do
                not sell Google user data.
              </li>
              <li>
                We do not transfer Google user data to third parties except as
                necessary to provide or improve the Service, to comply with
                applicable law, or as part of a merger, acquisition, or sale
                of assets with notice to you.
              </li>
              <li>
                Humans do not read Google user data unless we have your
                explicit consent, it is necessary for security purposes (e.g.
                investigating abuse), to comply with applicable law, or for
                internal operations limited to aggregated and anonymized data.
              </li>
            </ul>

            <h2>5. How we share your information</h2>
            <p>
              We do not sell your personal information. We share information
              only with the service providers necessary to run Friday:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> — provides our database, file
                storage, and authentication infrastructure. Your account
                credentials and all content you create in Friday are stored on
                Supabase-managed PostgreSQL.
              </li>
              <li>
                <strong>Vercel</strong> — hosts the
                Friday web application and processes incoming requests.
              </li>
              <li>
                <strong>Google</strong> — if you connect Google Calendar, we
                send authenticated requests to Google&rsquo;s APIs on your
                behalf to fetch event data.
              </li>
            </ul>
            <p>
              We may also disclose information if required by law, subpoena,
              or other legal process, or if we believe in good faith that
              disclosure is necessary to protect the rights, property, or
              safety of Friday, our users, or the public.
            </p>

            <h2>6. Data retention and deletion</h2>
            <p>
              We retain your account data for as long as your account is
              active. You can:
            </p>
            <ul>
              <li>
                <strong>Disconnect Google Calendar</strong> at any time from
                the Settings page in Friday. This deletes your stored OAuth
                tokens and cached calendar events from our database.
              </li>
              <li>
                <strong>Revoke Friday&rsquo;s access</strong> from your Google
                account at{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  myaccount.google.com/permissions
                </a>
                .
              </li>
              <li>
                <strong>Delete your Friday account</strong> by emailing us at{" "}
                <a href="mailto:dgaraventa5@gmail.com">
                  dgaraventa5@gmail.com
                </a>
                . We will delete your account and associated data within 30
                days, except where retention is required by law.
              </li>
            </ul>

            <h2>7. Security</h2>
            <p>
              We use industry-standard measures to protect your data,
              including TLS/HTTPS for data in transit, encryption at rest for
              data stored by Supabase, and row-level security policies that
              restrict each user&rsquo;s data to their own account. No system
              is completely secure; we encourage you to use a strong, unique
              password.
            </p>

            <h2>8. Children&rsquo;s privacy</h2>
            <p>
              Friday is not intended for children under 13 (or the minimum age
              in your jurisdiction). We do not knowingly collect personal
              information from children. If you believe a child has provided
              us with personal information, please contact us and we will
              delete it.
            </p>

            <h2>9. International users</h2>
            <p>
              Friday is operated from California, USA. If you access the
              Service from outside California, USA, you understand that
              your information may be transferred to, stored, and processed
              in California, USA and the regions where our service
              providers operate.
            </p>

            <h2>10. Your rights</h2>
            <p>
              Depending on where you live, you may have rights to access,
              correct, export, or delete your personal information, or to
              object to certain processing. To exercise these rights, email us
              at{" "}
              <a href="mailto:dgaraventa5@gmail.com">dgaraventa5@gmail.com</a>.
            </p>

            <h2>11. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes, we will notify you by email or through the
              Service. The &ldquo;Last updated&rdquo; date at the top of this
              page reflects the latest revision.
            </p>

            <h2>12. Contact</h2>
            <p>
              Questions, concerns, or requests about this policy or your
              data? Email us at{" "}
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
