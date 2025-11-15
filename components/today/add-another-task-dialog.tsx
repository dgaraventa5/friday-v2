'use client';

import { Task } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AddAnotherTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedTask: Task | null;
  onYes: () => void;
  onNo: () => void;
}

export function AddAnotherTaskDialog({
  open,
  onOpenChange,
  completedTask,
  onYes,
  onNo,
}: AddAnotherTaskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Great job!</AlertDialogTitle>
          <AlertDialogDescription>
            You just completed "{completedTask?.title}". Want to add another task to today's focus?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onNo}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={onYes}>Yes, Add One</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
