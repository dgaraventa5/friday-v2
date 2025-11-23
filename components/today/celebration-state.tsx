'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface CelebrationStateProps {
  completedCount: number;
  baselineCount?: number;
}

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
];

export function CelebrationState({ 
  completedCount,
  baselineCount = 4,
}: CelebrationStateProps) {
  // Use state to avoid hydration mismatch from Math.random()
  const [quote, setQuote] = useState(QUOTES[0]);
  
  useEffect(() => {
    // Set random quote only on client side after mount
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);
  
  const isExtraCredit = completedCount > baselineCount;
  const title = isExtraCredit
    ? `All ${baselineCount} tasks complete - plus ${completedCount - baselineCount} bonus!`
    : `All ${completedCount} tasks complete!`;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${
          isExtraCredit 
            ? 'from-yellow-400 to-amber-500' 
            : 'from-green-400 to-emerald-500'
        } animate-bounce`}>
          <Sparkles className="w-10 h-10 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2 text-balance">
        {title}
      </h2>
      
      <p className="text-muted-foreground max-w-md leading-relaxed text-pretty">
        {quote}
      </p>

      <div className="mt-8 p-4 bg-muted rounded-lg max-w-sm">
        <p className="text-sm text-muted-foreground">
          You've earned a well-deserved break. See you tomorrow!
        </p>
      </div>
    </div>
  );
}
