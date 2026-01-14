import { renderHook, act } from '@testing-library/react';
import { useDialogState } from '@/hooks/use-dialog-state';

describe('useDialogState', () => {
  describe('Initial State', () => {
    it('should initialize with all dialogs closed', () => {
      const { result } = renderHook(() => useDialogState());

      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(false);
    });
  });

  describe('Task Dialog', () => {
    it('should open task dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openAddTaskDialog();
      });

      expect(result.current.showAddTaskDialog).toBe(true);
    });

    it('should close task dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(true);

      act(() => {
        result.current.closeAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(false);
    });

    it('should toggle task dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.toggleAddTaskDialog(true);
      });
      expect(result.current.showAddTaskDialog).toBe(true);

      act(() => {
        result.current.toggleAddTaskDialog(false);
      });
      expect(result.current.showAddTaskDialog).toBe(false);
    });
  });

  describe('Reminder Dialog', () => {
    it('should open reminder dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openAddReminderDialog();
      });

      expect(result.current.showAddReminderDialog).toBe(true);
    });

    it('should close reminder dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openAddReminderDialog();
      });
      expect(result.current.showAddReminderDialog).toBe(true);

      act(() => {
        result.current.closeAddReminderDialog();
      });
      expect(result.current.showAddReminderDialog).toBe(false);
    });

    it('should toggle reminder dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.toggleAddReminderDialog(true);
      });
      expect(result.current.showAddReminderDialog).toBe(true);

      act(() => {
        result.current.toggleAddReminderDialog(false);
      });
      expect(result.current.showAddReminderDialog).toBe(false);
    });
  });

  describe('Multiple Dialogs', () => {
    it('should manage both dialogs independently', () => {
      const { result } = renderHook(() => useDialogState());

      // Open task dialog
      act(() => {
        result.current.openAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(true);
      expect(result.current.showAddReminderDialog).toBe(false);

      // Open reminder dialog
      act(() => {
        result.current.openAddReminderDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(true);
      expect(result.current.showAddReminderDialog).toBe(true);

      // Close task dialog
      act(() => {
        result.current.closeAddTaskDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(true);

      // Close reminder dialog
      act(() => {
        result.current.closeAddReminderDialog();
      });
      expect(result.current.showAddTaskDialog).toBe(false);
      expect(result.current.showAddReminderDialog).toBe(false);
    });
  });
});
