import { Lightbulb } from 'lucide-react';

export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
          <Lightbulb className="w-10 h-10 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-balance">
        Welcome to Friday
      </h2>

      <div className="space-y-4 max-w-md text-muted-foreground leading-relaxed">
        <p className="text-pretty">
          Focus on what matters most. We'll help you prioritize your daily tasks using proven
          productivity principles, so you can achieve more with less stress.
        </p>

        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium text-foreground mb-2">How it works:</p>
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              <span>Add your tasks with importance and urgency</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              <span>We'll prioritize them using the Eisenhower Matrix</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              <span>Focus on up to 4 critical tasks each day</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">4.</span>
              <span>Build your productivity streak</span>
            </li>
          </ul>
        </div>

        <p className="text-sm pt-2">
          Tap the + button below to add your first task and get started.
        </p>
      </div>
    </div>
  );
}
