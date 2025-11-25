# ☀️ Friday

**Focus on what matters most.**

Friday is a task management app that helps you prioritize your daily tasks using the Eisenhower Matrix, so you achieve more with less stress. Instead of drowning in endless to-do lists, Friday automatically surfaces your top 4 tasks each day based on importance, urgency, and deadlines.

## The Problem

Traditional productivity apps make you *less* productive:

- **Endless task lists** pile up without helping you prioritize
- **Cognitive overload** leads to analysis paralysis
- **Getting organized becomes a chore** that takes time away from actual work

## How Friday is Different

Friday is built for people who want to achieve more without the overwhelm:

1. **Add your tasks** — Quick input with name, category, importance, and urgency
2. **Friday prioritizes automatically** — Using the Eisenhower Matrix algorithm
3. **See your top 4 tasks** — Your daily focus, automatically selected
4. **Complete and celebrate** — Check off tasks, build streaks, and see what's next

> *"What is important is seldom urgent, and what is urgent is seldom important."*
> — Dwight D. Eisenhower

## Key Features

### Eisenhower Matrix Prioritization

Every task is categorized into one of four quadrants based on urgency and importance:

| Quadrant | Description | Action |
|----------|-------------|--------|
| **Q1: Critical** | Urgent + Important | Do first |
| **Q2: Plan** | Important, Not Urgent | Schedule time |
| **Q3: Urgent** | Urgent, Not Important | Delegate if possible |
| **Q4: Backlog** | Neither Urgent nor Important | Consider eliminating |

### Daily Focus (Top 4 Tasks)

Friday's algorithm automatically surfaces your most important tasks each day. The scoring system considers:

- **Base priority** from Eisenhower quadrant
- **Due date pressure** with exponential scaling as deadlines approach
- **Duration pressure** to ensure large tasks get started early enough
- **Age factor** to prevent tasks from being forgotten

### Smart Scheduling

- Automatically assigns start dates based on priority and capacity
- Respects category limits and daily hour/task caps
- Handles overdue tasks by bubbling them to the top
- Schedules tasks with due dates before their deadlines when possible

### Categories

Organize tasks across four life areas:

- 💼 **Work** — Professional responsibilities
- 🏠 **Home** — Household tasks and errands
- ❤️ **Health** — Exercise, medical, wellness
- 👤 **Personal** — Everything else

Each category has configurable weekday and weekend hour limits to maintain life balance.

### Recurring Tasks

Create tasks that repeat automatically:

- **Daily** — Every day
- **Weekly** — Select specific days of the week
- **Monthly** — Same day each month

Supports end conditions: repeat forever or after N occurrences.

### Streak Tracking

Build momentum with daily streaks. Complete at least one task each day to maintain your streak and track your longest streak over time.

### Configurable Limits

Fine-tune your productivity settings:

- **Category limits** — Max hours per category (weekday/weekend)
- **Daily max hours** — Total work capacity per day
- **Daily max tasks** — Prevent overcommitment (default: 4)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [Supabase](https://supabase.com/) | Authentication + PostgreSQL database |
| [Radix UI](https://www.radix-ui.com/) | Accessible component primitives |
| [date-fns](https://date-fns.org/) | Date manipulation |
| [Vercel](https://vercel.com/) | Deployment |

## Getting Started

### Prerequisites

- Node.js 18+ 
- A [Supabase](https://supabase.com/) account (free tier works)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/friday.git
cd friday

# Install dependencies
npm install

# Run database migrations (see scripts/ folder)
# Execute SQL files in order: 001, 002, 003, etc.

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Database Setup

Run the SQL migration scripts in the `scripts/` folder in order:

1. `001_create_tables.sql` — Core tables (profiles, tasks)
2. `002_add_eisenhower_and_recurring_fields.sql` — Priority and recurrence fields
3. `003_add_daily_max_tasks.sql` — Task limit settings
4. Additional migrations as needed

## Project Structure

```
friday/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (settings, streak)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── settings/          # User settings
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── landing/           # Marketing landing page
│   ├── settings/          # Settings form
│   ├── today/             # Today's focus view
│   └── ui/                # Reusable UI components
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── utils/             # Utility functions
│   │   ├── task-prioritization.ts  # Core scheduling algorithm
│   │   ├── recurring-tasks.ts      # Recurrence logic
│   │   ├── streak-tracking.ts      # Streak calculations
│   │   └── date-utils.ts           # Date helpers
│   └── types.ts           # TypeScript type definitions
├── scripts/               # Database migration SQL files
└── public/                # Static assets
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## License

MIT

---

Built with ☀️ for people who want to focus on what matters most.
