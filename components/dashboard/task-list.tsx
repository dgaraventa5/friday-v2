"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { TaskCard } from "./task-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskListProps {
  initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  
  const mitTasks = activeTasks.filter((task) => task.is_mit);
  const priorityATasks = activeTasks.filter((task) => task.priority === 'A' && !task.is_mit);
  const priorityBTasks = activeTasks.filter((task) => task.priority === 'B');
  const priorityCTasks = activeTasks.filter((task) => task.priority === 'C');
  const unprioritizedTasks = activeTasks.filter((task) => !task.priority && !task.is_mit);

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="active">
          Active ({activeTasks.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completedTasks.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-8 mt-6">
        {mitTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Most Important Tasks
            </h2>
            <div className="space-y-3">
              {mitTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {priorityATasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Priority A - Critical
            </h2>
            <div className="space-y-3">
              {priorityATasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {priorityBTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Priority B - Important
            </h2>
            <div className="space-y-3">
              {priorityBTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {priorityCTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Priority C - Nice to Have
            </h2>
            <div className="space-y-3">
              {priorityCTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {unprioritizedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Unprioritized
            </h2>
            <div className="space-y-3">
              {unprioritizedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {activeTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No active tasks. Add your first task to get started.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        {completedTasks.length > 0 ? (
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No completed tasks yet. Keep going!
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
