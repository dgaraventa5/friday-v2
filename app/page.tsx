import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="text-xl font-semibold">Friday</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance mb-6">
              Focus on what matters most
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              We help you prioritize your daily tasks using the Eisenhower Matrix
              and smart scheduling, so you can achieve more with less stress.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Start Prioritizing Today
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-12 text-center text-balance">
              Smart Task Prioritization
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              <div className="bg-card p-6 rounded-lg border border-l-4 border-l-red-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                    Do First
                  </span>
                  <h3 className="text-xl font-semibold">Urgent & Important</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Critical tasks that need immediate attention. These get scheduled first.
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                    Schedule
                  </span>
                  <h3 className="text-xl font-semibold">Not Urgent & Important</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Important tasks that can be planned ahead. Build your future success.
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                    Delegate
                  </span>
                  <h3 className="text-xl font-semibold">Urgent & Not Important</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Time-sensitive tasks that could be handled by someone else.
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border border-l-4 border-l-slate-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-medium">
                    Eliminate
                  </span>
                  <h3 className="text-xl font-semibold">Not Urgent & Not Important</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Low-priority tasks. Consider if they're worth your time at all.
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-4 text-balance">How Friday Works</h3>
              <div className="bg-card rounded-lg p-6 border text-left space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium mb-1">Add your tasks with context</p>
                    <p className="text-sm text-muted-foreground">
                      Mark each task as important/not important and urgent/not urgent
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium mb-1">Automatic smart scheduling</p>
                    <p className="text-sm text-muted-foreground">
                      Tasks are automatically scheduled based on priority, category limits, and capacity
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium mb-1">Focus on today's 4 tasks</p>
                    <p className="text-sm text-muted-foreground">
                      Each day, focus on up to 4 critical tasks. Complete them and build your streak.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-medium mb-1">Track your productivity</p>
                    <p className="text-sm text-muted-foreground">
                      Build streaks, schedule recurring tasks, and see your upcoming work
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 Friday. Focus on what matters.</p>
        </div>
      </footer>
    </div>
  );
}
