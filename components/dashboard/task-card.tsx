"use client";

import { useState } from "react";
import { useSupabase } from '@/lib/supabase/provider';
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { EditTaskDialog } from "./edit-task-dialog";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const supabase = useSupabase();

  const handleToggleComplete = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .select()
      .single();

    if (!error && data) {
      onUpdate(data);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (!error) {
      onDelete(task.id);
    }
  };

  const priorityColors = {
    A: "border-l-orange-500",
    B: "border-l-blue-500",
    C: "border-l-green-500",
  };

  const priorityColor = task.is_mit
    ? "border-l-red-500"
    : task.priority
    ? priorityColors[task.priority]
    : "border-l-gray-300";

  return (
    <>
      <Card
        className={cn(
          "p-4 border-l-4 transition-all hover:shadow-md",
          priorityColor,
          task.completed && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-medium leading-relaxed",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.is_mit && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                      MIT
                    </span>
                  )}
                  {task.priority && (
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        task.priority === "A" &&
                          "bg-orange-100 text-orange-700",
                        task.priority === "B" && "bg-blue-100 text-blue-700",
                        task.priority === "C" && "bg-green-100 text-green-700"
                      )}
                    >
                      Priority {task.priority}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
