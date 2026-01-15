'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, RecalibrationTask, PendingTaskChanges, RecalibrationLocalStorage } from '@/lib/types';
import {
  getTasksForRecalibration,
  shouldShowRecalibration,
  getSnoozeEndTime,
  parseTriggerHour,
} from '@/lib/utils/recalibration-utils';
import { getTodayLocal } from '@/lib/utils/date-utils';

const STORAGE_KEY = 'friday_recalibration_state';

function getLocalState(): RecalibrationLocalStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setLocalState(state: RecalibrationLocalStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
}

interface UseRecalibrationOptions {
  triggerTime?: string;  // "HH:MM:SS" format
  includeTomorrow?: boolean;
  enabled?: boolean;
}

interface UseRecalibrationReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  visibleTasks: {
    overdue: RecalibrationTask[];
    dueToday: RecalibrationTask[];
    dueTomorrow: RecalibrationTask[];
  };
  totalTaskCount: number;
  pendingChanges: Map<string, PendingTaskChanges>;
  reviewedTaskIds: Set<string>;
  updateTaskChanges: (taskId: string, changes: Partial<PendingTaskChanges>) => void;
  markTaskReviewed: (taskId: string) => void;
  hideTask: (taskId: string) => void;
  skipToday: () => void;
  snooze: () => void;
  close: () => void;
  openManually: () => void;
  getAllPendingChanges: () => Array<{ taskId: string; changes: PendingTaskChanges }>;
  hasChanges: boolean;
  reviewedCount: number;
  resetState: () => void;
}

export function useRecalibration(
  tasks: Task[],
  options: UseRecalibrationOptions = {}
): UseRecalibrationReturn {
  const {
    triggerTime = '17:00:00',
    includeTomorrow = true,
    enabled = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingTaskChanges>>(new Map());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
  const [reviewedTaskIds, setReviewedTaskIds] = useState<Set<string>>(new Set());
  const [hasCheckedTrigger, setHasCheckedTrigger] = useState(false);

  const triggerHour = useMemo(() => parseTriggerHour(triggerTime), [triggerTime]);

  // Get categorized tasks
  const { overdue, dueToday, dueTomorrow } = useMemo(
    () => getTasksForRecalibration(tasks, includeTomorrow),
    [tasks, includeTomorrow]
  );

  // Filter out hidden tasks
  const visibleTasks = useMemo(() => ({
    overdue: overdue.filter(t => !hiddenTaskIds.has(t.id)),
    dueToday: dueToday.filter(t => !hiddenTaskIds.has(t.id)),
    dueTomorrow: dueTomorrow.filter(t => !hiddenTaskIds.has(t.id)),
  }), [overdue, dueToday, dueTomorrow, hiddenTaskIds]);

  const totalTaskCount = visibleTasks.overdue.length +
                         visibleTasks.dueToday.length +
                         visibleTasks.dueTomorrow.length;

  // Count of reviewed tasks (those explicitly marked as reviewed or with pending changes)
  const reviewedCount = useMemo(() => {
    const allVisibleIds = new Set([
      ...visibleTasks.overdue.map(t => t.id),
      ...visibleTasks.dueToday.map(t => t.id),
      ...visibleTasks.dueTomorrow.map(t => t.id),
    ]);

    let count = 0;
    allVisibleIds.forEach(id => {
      if (reviewedTaskIds.has(id) || pendingChanges.has(id)) {
        count++;
      }
    });
    return count;
  }, [visibleTasks, reviewedTaskIds, pendingChanges]);

  // Check if should auto-trigger
  useEffect(() => {
    if (hasCheckedTrigger || !enabled) return;

    const localState = getLocalState();
    if (shouldShowRecalibration(tasks, triggerHour, localState, enabled)) {
      // Delay slightly to not interrupt page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
    setHasCheckedTrigger(true);
  }, [tasks, triggerHour, hasCheckedTrigger, enabled]);

  // Update pending changes for a task (also marks it as reviewed)
  const updateTaskChanges = useCallback((taskId: string, changes: Partial<PendingTaskChanges>) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(taskId) || {};
      newMap.set(taskId, { ...existing, ...changes });
      return newMap;
    });
  }, []);

  // Mark a task as explicitly reviewed (keep-as-is)
  const markTaskReviewed = useCallback((taskId: string) => {
    setReviewedTaskIds(prev => new Set(prev).add(taskId));
  }, []);

  // Hide task from current session
  const hideTask = useCallback((taskId: string) => {
    setHiddenTaskIds(prev => new Set(prev).add(taskId));
  }, []);

  // Reset state (for reuse)
  const resetState = useCallback(() => {
    setPendingChanges(new Map());
    setHiddenTaskIds(new Set());
    setReviewedTaskIds(new Set());
  }, []);

  // Skip for today
  const skipToday = useCallback(() => {
    setLocalState({
      lastDismissedDate: getTodayLocal(),
      snoozedUntil: null,
    });
    setIsOpen(false);
    resetState();
  }, [resetState]);

  // Snooze for 1 hour
  const snooze = useCallback(() => {
    const localState = getLocalState();
    setLocalState({
      lastDismissedDate: localState?.lastDismissedDate || null,
      snoozedUntil: getSnoozeEndTime(),
    });
    setIsOpen(false);
  }, []);

  // Open modal manually (bypasses time/dismissed checks)
  const openManually = useCallback(() => {
    resetState();
    setIsOpen(true);
  }, [resetState]);

  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
    resetState();
  }, [resetState]);

  // Get all pending changes for submission
  const getAllPendingChanges = useCallback(() => {
    return Array.from(pendingChanges.entries()).map(([taskId, changes]) => ({
      taskId,
      changes,
    }));
  }, [pendingChanges]);

  return {
    isOpen,
    setIsOpen,
    visibleTasks,
    totalTaskCount,
    pendingChanges,
    reviewedTaskIds,
    updateTaskChanges,
    markTaskReviewed,
    hideTask,
    skipToday,
    snooze,
    close,
    openManually,
    getAllPendingChanges,
    hasChanges: pendingChanges.size > 0,
    reviewedCount,
    resetState,
  };
}
