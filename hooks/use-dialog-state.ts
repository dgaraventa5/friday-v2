import { useState } from 'react';

interface UseDialogStateReturn {
  showAddTaskDialog: boolean;
  showAddReminderDialog: boolean;
  openAddTaskDialog: () => void;
  closeAddTaskDialog: () => void;
  openAddReminderDialog: () => void;
  closeAddReminderDialog: () => void;
  toggleAddTaskDialog: (open: boolean) => void;
  toggleAddReminderDialog: (open: boolean) => void;
}

/**
 * Hook to manage dialog state for tasks and reminders
 * Centralizes dialog visibility state and provides helper functions
 */
export function useDialogState(): UseDialogStateReturn {
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showAddReminderDialog, setShowAddReminderDialog] = useState(false);

  const openAddTaskDialog = () => setShowAddTaskDialog(true);
  const closeAddTaskDialog = () => setShowAddTaskDialog(false);
  const openAddReminderDialog = () => setShowAddReminderDialog(true);
  const closeAddReminderDialog = () => setShowAddReminderDialog(false);

  const toggleAddTaskDialog = (open: boolean) => setShowAddTaskDialog(open);
  const toggleAddReminderDialog = (open: boolean) => setShowAddReminderDialog(open);

  return {
    showAddTaskDialog,
    showAddReminderDialog,
    openAddTaskDialog,
    closeAddTaskDialog,
    openAddReminderDialog,
    closeAddReminderDialog,
    toggleAddTaskDialog,
    toggleAddReminderDialog,
  };
}
