export const ONBOARDING_COPY = {
  welcome: {
    headline: 'focus on what matters most.',
    body: "we'll help you sort through the noise and zero in on your top priorities — starting with the one thing on your mind right now.",
    cta: "let's go →",
    time_hint: 'takes about 60 seconds',
  },
  taskInput: {
    headline: "what's the one thing you need to get done?",
    placeholder: 'e.g., finish the quarterly report',
    dateLabel: 'when does it need to happen?',
    datePresets: {
      today: 'today',
      tomorrow: 'tomorrow',
      this_week: 'this week',
      someday: 'someday',
      custom: '📅 pick a date...',
    },
    cta: 'continue →',
  },
  classify: {
    headline: "let's prioritize it.",
    importanceLabel: 'is it important?',
    importanceHint: 'tasks that directly impact your goals.',
    importantOption: '⭐ important',
    notImportantOption: 'not important',
    urgencyLabel: 'is it urgent?',
    urgencyHint: "tasks that can't wait — they need attention now.",
    urgentOption: '🔥 urgent',
    notUrgentOption: 'not urgent',
    cta: 'see where it lands →',
  },
  reveal: {
    headline: "nice — you've got this. ✨",
    cta: 'go to my dashboard →',
    quadrants: {
      critical: {
        name: 'critical',
        subtitle: 'do first',
        explanation: 'your task is urgent AND important — that makes it critical.',
        detail: "this means it should be the first thing you tackle today. friday will always surface your critical tasks at the top so nothing slips.",
      },
      plan: {
        name: 'plan',
        subtitle: 'schedule it',
        explanation: "your task is important but not urgent — time to plan.",
        detail: "schedule dedicated time for this one. these tasks drive long-term success but are easy to put off. friday will remind you before they become urgent.",
      },
      urgent: {
        name: 'urgent',
        subtitle: 'delegate or batch',
        explanation: "your task is urgent but not that important — handle it quickly.",
        detail: "knock this out fast or hand it off. don't let it eat into time for the things that really matter. friday keeps these separate so they don't hijack your day.",
      },
      backlog: {
        name: 'backlog',
        subtitle: 'drop it?',
        explanation: "your task isn't urgent or important — it's in the backlog.",
        detail: "this is a 'nice to have.' do it if you have the time, skip it if you don't. friday keeps these out of your way so you can focus on what counts.",
      },
    },
  },
  nav: {
    back: '← back',
    stepIndicator: (current: number, total: number) => `step ${current} of ${total}`,
  },
} as const;
