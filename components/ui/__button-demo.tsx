/**
 * BUTTON COMPONENT DEMO
 * 
 * This file demonstrates all button variants according to the Friday design system.
 * Use this to visually test button styles during development.
 * 
 * To test: Create a test page and import this component.
 */

import { Button } from './button';
import { Plus, Trash2, Settings, ChevronRight } from 'lucide-react';

export function ButtonDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      {/* Primary Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Primary Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Yellow-500 background, Slate-900 text. Use sparingly for main CTAs!
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button size="sm">Small Primary</Button>
          <Button>Default Primary</Button>
          <Button size="lg">Large Primary</Button>
          <Button>
            <Plus />
            Add Task
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Secondary Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Secondary Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          White background, Slate-200 border, Slate-700 text.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="secondary" size="sm">
            Small Secondary
          </Button>
          <Button variant="secondary">Default Secondary</Button>
          <Button variant="secondary" size="lg">
            Large Secondary
          </Button>
          <Button variant="secondary">
            <Settings />
            Settings
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Outline Buttons (Alias for Secondary) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Outline Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Alias for secondary. Same styling for backward compatibility.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="outline" size="sm">
            Small Outline
          </Button>
          <Button variant="outline">Default Outline</Button>
          <Button variant="outline" size="lg">
            Large Outline
          </Button>
          <Button variant="outline">
            Cancel
          </Button>
        </div>
      </section>

      {/* Ghost Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Ghost Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Transparent, Slate-600 text, hover Slate-100.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="ghost" size="sm">
            Small Ghost
          </Button>
          <Button variant="ghost">Default Ghost</Button>
          <Button variant="ghost" size="lg">
            Large Ghost
          </Button>
          <Button variant="ghost">
            View More
            <ChevronRight />
          </Button>
          <Button variant="ghost" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Destructive Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Destructive Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Red-600 background, white text. For dangerous actions.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="destructive" size="sm">
            Small Destructive
          </Button>
          <Button variant="destructive">Delete Task</Button>
          <Button variant="destructive" size="lg">
            Large Destructive
          </Button>
          <Button variant="destructive">
            <Trash2 />
            Delete
          </Button>
          <Button variant="destructive" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Link Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Link Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Blue underlined text. For inline navigation.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="link">Learn More</Button>
          <Button variant="link" disabled>
            Disabled Link
          </Button>
        </div>
      </section>

      {/* Icon Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Icon Buttons
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Square buttons with no scale effect on hover.
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="ghost" size="icon-sm">
            <Settings />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
          <Button variant="ghost" size="icon-lg">
            <Settings />
          </Button>
          <Button variant="secondary" size="icon">
            <Plus />
          </Button>
          <Button size="icon">
            <Plus />
          </Button>
        </div>
      </section>

      {/* Interaction States Demo */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Interaction States
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Try hovering, clicking, and focusing these buttons to see the interactions.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hover: Scale 1.02 + lighter background
            </p>
            <Button>Hover over me</Button>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Active: Scale 0.98 (click and hold)
            </p>
            <Button variant="secondary">Click and hold</Button>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Focus: Blue-500 ring (3px) - Tab to focus
            </p>
            <Button variant="ghost">Tab to focus me</Button>
          </div>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Real-world Button Groups
        </h2>
        <div className="space-y-6">
          {/* Form Actions */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Form Actions</h3>
            <div className="flex gap-3">
              <Button className="flex-1">
                <Plus />
                Save Task
              </Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </div>

          {/* Card Actions */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Card Actions</h3>
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm">
                View Details
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Toolbar</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
              <Button variant="ghost" size="icon">
                <Plus />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Design System Compliance */}
      <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          ✅ Design System Compliance
        </h2>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Yellow-500 primary color (#F59E0B)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Hover scale: 1.02
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Active scale: 0.98
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Focus ring: Blue-500, 3px width
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Transition: 150ms ease-out
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            WCAG 2.1 AA compliant color contrast
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Keyboard accessible
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Dark mode support
          </li>
        </ul>
      </section>
    </div>
  );
}

