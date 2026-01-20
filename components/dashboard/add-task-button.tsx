"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { AddTaskDialog } from "./add-task-dialog";

export function AddTaskButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="lg">
        <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
        Add Task
      </Button>
      <AddTaskDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
