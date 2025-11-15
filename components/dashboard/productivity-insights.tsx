"use client";

import { Task } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ProductivityInsightsProps {
  tasks: Task[];
}

export function ProductivityInsights({ tasks }: ProductivityInsightsProps) {
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // MIT (Most Important Tasks) tracking
  const mitTasks = tasks.filter((task) => task.is_mit);
  const mitCompleted = mitTasks.filter((task) => task.completed).length;
  const mitProgress = mitTasks.length > 0 ? (mitCompleted / mitTasks.length) * 100 : 0;

  // 1-3-5 Rule tracking
  const priorityATasks = activeTasks.filter((task) => task.priority === 'A');
  const priorityBTasks = activeTasks.filter((task) => task.priority === 'B');
  const priorityCTasks = activeTasks.filter((task) => task.priority === 'C');

  const oneThreeFiveStatus = {
    big: { target: 1, current: priorityATasks.length, met: priorityATasks.length <= 1 },
    medium: { target: 3, current: priorityBTasks.length, met: priorityBTasks.length <= 3 },
    small: { target: 5, current: priorityCTasks.length, met: priorityCTasks.length <= 5 },
  };

  // ABC Method completion
  const priorityACompleted = tasks.filter((t) => t.priority === 'A' && t.completed).length;
  const priorityBCompleted = tasks.filter((t) => t.priority === 'B' && t.completed).length;
  const priorityCCompleted = tasks.filter((t) => t.priority === 'C' && t.completed).length;

  const totalPrioritized = tasks.filter((t) => t.priority).length;
  const prioritizedCompleted = priorityACompleted + priorityBCompleted + priorityCCompleted;
  const abcProgress = totalPrioritized > 0 ? (prioritizedCompleted / totalPrioritized) * 100 : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* MIT Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Most Important Tasks (MIT)
          </CardTitle>
          <CardDescription>
            Focus on your 1-3 most critical tasks first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {mitCompleted} of {mitTasks.length} completed
              </span>
            </div>
            <Progress value={mitProgress} className="h-2" />
            {mitTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Mark your most critical tasks as MIT to track them here
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mitCompleted === mitTasks.length
                  ? "Great job! All MITs completed!"
                  : `${mitTasks.length - mitCompleted} MIT${mitTasks.length - mitCompleted === 1 ? '' : 's'} remaining`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1-3-5 Rule */}
      <Card>
        <CardHeader>
          <CardTitle>1-3-5 Rule</CardTitle>
          <CardDescription>
            1 big, 3 medium, 5 small tasks for balanced productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {oneThreeFiveStatus.big.met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-sm">Big tasks (A)</span>
              </div>
              <span className="text-sm font-medium">
                {oneThreeFiveStatus.big.current} / {oneThreeFiveStatus.big.target}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {oneThreeFiveStatus.medium.met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-sm">Medium tasks (B)</span>
              </div>
              <span className="text-sm font-medium">
                {oneThreeFiveStatus.medium.current} / {oneThreeFiveStatus.medium.target}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {oneThreeFiveStatus.small.met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-sm">Small tasks (C)</span>
              </div>
              <span className="text-sm font-medium">
                {oneThreeFiveStatus.small.current} / {oneThreeFiveStatus.small.target}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABC Method */}
      <Card>
        <CardHeader>
          <CardTitle>ABC Priority Method</CardTitle>
          <CardDescription>
            Complete high-priority tasks before moving to lower priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall completion</span>
              <span className="font-medium">
                {prioritizedCompleted} of {totalPrioritized}
              </span>
            </div>
            <Progress value={abcProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {priorityACompleted}
                </div>
                <div className="text-xs text-muted-foreground">A Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {priorityBCompleted}
                </div>
                <div className="text-xs text-muted-foreground">B Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {priorityCCompleted}
                </div>
                <div className="text-xs text-muted-foreground">C Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Summary</CardTitle>
          <CardDescription>
            Your productivity at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total tasks</span>
              <span className="text-2xl font-bold">{tasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-2xl font-bold text-green-600">
                {completedTasks.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-2xl font-bold text-blue-600">
                {activeTasks.length}
              </span>
            </div>
            {tasks.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completion rate</span>
                  <span className="font-medium">
                    {Math.round((completedTasks.length / tasks.length) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(completedTasks.length / tasks.length) * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
