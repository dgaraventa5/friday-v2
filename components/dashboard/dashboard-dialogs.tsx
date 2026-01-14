import { Task, Reminder } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskForm } from '@/components/task/add-task-form';
import { EditTaskDialog } from '@/components/task/edit-task-dialog';
import { AddReminderModal } from '@/components/reminders/add-reminder-modal';
import { EditReminderModal } from '@/components/reminders/edit-reminder-modal';

interface DashboardDialogsProps {
  // Task dialog props
  showAddTaskDialog: boolean;
  toggleAddTaskDialog: (open: boolean) => void;
  closeAddTaskDialog: () => void;
  addTask: (newTasks: Task | Task[]) => Promise<void>;

  editingTask: Task | null;
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  updateTask: (updatedTask: Task) => Promise<void>;

  // Reminder dialog props
  showAddReminderDialog: boolean;
  toggleAddReminderDialog: (open: boolean) => void;
  closeAddReminderDialog: () => void;
  addReminder: (reminderData: Partial<Reminder>) => Promise<void>;

  editingReminder: Reminder | null;
  showEditReminderDialog: boolean;
  setShowEditReminderDialog: (show: boolean) => void;
  updateReminder: (updatedReminder: Reminder) => Promise<void>;
}

/**
 * Component that renders all dashboard dialogs
 * Consolidates dialog rendering in one place for better organization
 */
export function DashboardDialogs({
  showAddTaskDialog,
  toggleAddTaskDialog,
  closeAddTaskDialog,
  addTask,
  editingTask,
  showEditDialog,
  setShowEditDialog,
  updateTask,
  showAddReminderDialog,
  toggleAddReminderDialog,
  closeAddReminderDialog,
  addReminder,
  editingReminder,
  showEditReminderDialog,
  setShowEditReminderDialog,
  updateReminder,
}: DashboardDialogsProps) {
  return (
    <>
      {/* Add Task Dialog */}
      <Dialog open={showAddTaskDialog} onOpenChange={toggleAddTaskDialog}>
        <DialogContent className="dialog-sheet max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <AddTaskForm
            onTaskAdded={async (newTasks) => {
              await addTask(newTasks);
              closeAddTaskDialog();
            }}
            onCancel={closeAddTaskDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTaskUpdated={updateTask}
      />

      {/* Add Reminder Modal */}
      <AddReminderModal
        open={showAddReminderDialog}
        onOpenChange={toggleAddReminderDialog}
        onSave={async (reminderData) => {
          await addReminder(reminderData);
          closeAddReminderDialog();
        }}
      />

      {/* Edit Reminder Modal */}
      <EditReminderModal
        reminder={editingReminder}
        open={showEditReminderDialog}
        onOpenChange={setShowEditReminderDialog}
        onSave={updateReminder}
      />
    </>
  );
}
