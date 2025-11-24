"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: Task) => void;
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<"A" | "B" | "C" | "">(
    task.priority || ""
  );
  const [isMit, setIsMit] = useState(task.is_mit);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "");
    setIsMit(task.is_mit);
    setDueDate(task.due_date || "");
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title,
        description: description || null,
        priority: priority || null,
        is_mit: isMit,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .select()
      .single();

    setIsLoading(false);

    if (!error && data) {
      onUpdate(data);
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-sheet">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update your task details and priorities
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="edit-title">Task Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as "A" | "B" | "C" | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No priority</SelectItem>
                <SelectItem value="A">Priority A - Critical</SelectItem>
                <SelectItem value="B">Priority B - Important</SelectItem>
                <SelectItem value="C">Priority C - Nice to have</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-dueDate">Due Date (optional)</Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-mit"
              checked={isMit}
              onCheckedChange={(checked) => setIsMit(checked as boolean)}
              className="h-5 w-5"
            />
            <Label
              htmlFor="edit-mit"
              className="!mb-0 cursor-pointer"
            >
              Mark as Most Important Task (MIT)
            </Label>
          </div>

          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
