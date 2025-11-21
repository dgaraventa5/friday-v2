/**
 * FRIDAY DESIGN SYSTEM - USAGE EXAMPLES
 * 
 * This file contains practical examples of how to use the Friday design system
 * in your components. Copy and adapt these patterns as needed.
 */

import React from 'react';

// ============================================
// BUTTON EXAMPLES
// ============================================

export function ButtonExamples() {
  return (
    <div className="space-y-4">
      {/* Primary Button - Use sparingly for main CTAs */}
      <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium button-hover">
        Add Task
      </button>

      {/* Secondary Button */}
      <button className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-md font-medium button-hover hover:bg-slate-50">
        Cancel
      </button>

      {/* Ghost Button */}
      <button className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-md transition-fast ease-out">
        View Details
      </button>

      {/* Destructive Button */}
      <button className="bg-destructive text-destructive-foreground px-6 py-3 rounded-md font-medium button-hover">
        Delete Task
      </button>

      {/* Icon Button */}
      <button className="p-2 hover:bg-slate-100 rounded-md transition-fast" aria-label="More options">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  );
}

// ============================================
// CARD EXAMPLES
// ============================================

export function CardExamples() {
  return (
    <div className="space-y-6">
      {/* Default Card */}
      <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-slate-600 dark:text-slate-400">
          This is a default card with a border.
        </p>
      </div>

      {/* Elevated Card with Hover */}
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md card-hover cursor-pointer">
        <h3 className="text-lg font-semibold mb-2">Hoverable Card</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Hover over this card to see the elevation effect.
        </p>
      </div>

      {/* Outlined Card */}
      <div className="bg-transparent p-6 rounded-lg border-2 border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-2">Outlined Card</h3>
        <p className="text-slate-600 dark:text-slate-400">
          This card has a thicker border and transparent background.
        </p>
      </div>
    </div>
  );
}

// ============================================
// TASK CARD WITH QUADRANT COLORS
// ============================================

export function TaskCardExamples() {
  return (
    <div className="space-y-4">
      {/* Urgent + Important (Red) */}
      <div className="bg-card p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-slate-800 dark:text-slate-100">Fix critical bug</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                Critical
              </span>
              <span>Due today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Important + Not Urgent (Blue) */}
      <div className="bg-card p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-slate-800 dark:text-slate-100">Plan Q1 strategy</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Plan
              </span>
              <span>Due next week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent + Not Important (Amber) */}
      <div className="bg-card p-4 rounded-lg border-l-4 border-amber-500 shadow-sm">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-slate-800 dark:text-slate-100">Reply to emails</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                Urgent
              </span>
              <span>Due tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Neither Urgent nor Important (Slate) */}
      <div className="bg-card p-4 rounded-lg border-l-4 border-slate-400 shadow-sm">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-slate-800 dark:text-slate-100">Organize desk</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                Backlog
              </span>
              <span>Someday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FORM EXAMPLES
// ============================================

export function FormExamples() {
  return (
    <form className="space-y-6 max-w-md">
      {/* Text Input */}
      <div>
        <label htmlFor="task-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Task Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="task-name"
          placeholder="e.g., Call dentist"
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-input rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-fast"
        />
      </div>

      {/* Select */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Priority
        </label>
        <select
          id="priority"
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-input rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-fast"
        >
          <option>Urgent + Important</option>
          <option>Important</option>
          <option>Urgent</option>
          <option>Neither</option>
        </select>
      </div>

      {/* Textarea */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="Add any additional details..."
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-input rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-fast"
        />
      </div>

      {/* Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="recurring"
          className="mt-0.5 w-4 h-4 text-primary border-slate-300 rounded focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300">
          Make this a recurring task
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium button-hover"
        >
          Save Task
        </button>
        <button
          type="button"
          className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-md font-medium button-hover hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ============================================
// TYPOGRAPHY EXAMPLES
// ============================================

export function TypographyExamples() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Display Sizes - For hero sections */}
      <div>
        <h1 className="text-display-lg">Focus on What Matters Most</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-4">
          Large display heading for landing page hero sections
        </p>
      </div>

      <div>
        <h2 className="text-display-sm">Your Daily Tasks</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Medium display heading for page titles
        </p>
      </div>

      {/* Standard Text Hierarchy */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Section Heading</h3>
        <p className="text-base text-slate-600 dark:text-slate-400 mb-4">
          This is regular body text at 16px. Use this for most content. Keep line length
          between 50-75 characters for optimal readability.
        </p>
        <p className="text-sm text-slate-500">
          This is smaller text at 14px, useful for secondary information, captions,
          or helper text.
        </p>
      </div>

      {/* Lists */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Task List</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-slate-700 dark:text-slate-300">Complete morning routine</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-slate-700 dark:text-slate-300">Review emails</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">○</span>
            <span className="text-slate-700 dark:text-slate-300">Finish project proposal</span>
          </li>
        </ul>
      </div>

      {/* Code/Monospace */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Code Example</h4>
        <code className="block p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm text-slate-700 dark:text-slate-300">
          className="bg-primary text-primary-foreground"
        </code>
      </div>
    </div>
  );
}

// ============================================
// BADGE EXAMPLES
// ============================================

export function BadgeExamples() {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Status badges */}
      <span className="px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm font-medium">
        Completed
      </span>
      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm font-medium">
        In Progress
      </span>
      <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-sm font-medium">
        Pending
      </span>
      <span className="px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-sm font-medium">
        Urgent
      </span>
      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full text-sm font-medium">
        Low Priority
      </span>

      {/* Category badges */}
      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-full text-sm font-medium">
        Work
      </span>
      <span className="px-2.5 py-1 bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 rounded-full text-sm font-medium">
        Personal
      </span>
      <span className="px-2.5 py-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-sm font-medium">
        Health
      </span>
    </div>
  );
}

// ============================================
// PROGRESS INDICATORS
// ============================================

export function ProgressExamples() {
  return (
    <div className="space-y-8">
      {/* Linear Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Daily Progress
          </span>
          <span className="text-sm font-medium text-blue-600">
            75%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: '75%' }}
          />
        </div>
      </div>

      {/* With gradient */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Weekly Streak
          </span>
          <span className="text-sm font-medium text-orange-600">
            5/7 days
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: '71%' }}
          />
        </div>
      </div>

      {/* Circular Progress (conceptual) */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={176}
              strokeDashoffset={176 * (1 - 0.75)}
              className="text-blue-500 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              75%
            </span>
          </div>
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">3 of 4 tasks</p>
          <p className="text-sm text-slate-500">Almost there!</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STREAK INDICATOR
// ============================================

export function StreakExample() {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-800">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
          7-day streak!
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep it up!
        </p>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

export function EmptyStateExample() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
        No tasks yet
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
        Add your first task to get started. We'll help you prioritize what matters most.
      </p>
      <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium button-hover">
        Add Your First Task
      </button>
    </div>
  );
}

