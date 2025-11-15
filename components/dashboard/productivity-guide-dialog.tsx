"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductivityGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductivityGuideDialog({ open, onOpenChange }: ProductivityGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Productivity Methods Guide</DialogTitle>
          <DialogDescription>
            Learn how to use proven productivity principles to achieve more with less stress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="abc" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="abc">ABC Method</TabsTrigger>
            <TabsTrigger value="mit">MIT</TabsTrigger>
            <TabsTrigger value="135">1-3-5 Rule</TabsTrigger>
          </TabsList>

          <TabsContent value="abc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ABC Priority Method</CardTitle>
                <CardDescription>
                  Categorize tasks by importance to focus on what truly matters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Priority A - Critical
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tasks with serious consequences if not completed. These are your most important tasks that directly impact your goals.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Example: Client deadline, important meeting preparation
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Priority B - Important
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tasks with mild consequences if not completed. Important but not urgent.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Example: Follow-up emails, planning next week&apos;s schedule
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Priority C - Nice to Have
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tasks with no consequences if not completed. Nice to do but not essential.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Example: Organizing files, reading industry news
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">How to use it:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
                    <li>List all your tasks for the day</li>
                    <li>Assign each task an A, B, or C priority</li>
                    <li>Complete all A tasks before moving to B tasks</li>
                    <li>Complete all B tasks before moving to C tasks</li>
                    <li>Never do a C task when A or B tasks remain</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Important Tasks (MIT)</CardTitle>
                <CardDescription>
                  Focus on your 1-3 most critical tasks each day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What are MITs?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your Most Important Tasks are the 1-3 things that, if completed, will make your day a success. These are tasks that align with your biggest goals and have the most impact.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Why limit to 1-3?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Focusing on just a few critical tasks prevents overwhelm and ensures you actually complete what matters most. It&apos;s better to complete 3 important tasks than to partially complete 10.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">How to use it:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Each morning, identify your 1-3 MITs</li>
                    <li>Do these tasks first, before anything else</li>
                    <li>Block time in your calendar for MIT work</li>
                    <li>Don&apos;t check email or social media until MITs are done</li>
                    <li>Celebrate when you complete all your MITs</li>
                  </ol>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Pro tip:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plan your MITs the night before. This gives your brain time to prepare and helps you hit the ground running in the morning.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="135" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>The 1-3-5 Rule</CardTitle>
                <CardDescription>
                  Plan for balanced productivity: 1 big, 3 medium, 5 small tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What is the 1-3-5 Rule?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A realistic daily task framework that helps you plan a manageable workload while still making meaningful progress on big goals.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    1 Big Task (Priority A)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    One major task that requires significant time and energy. This is your most important work for the day.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    3 Medium Tasks (Priority B)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Three tasks that are important but don&apos;t require as much time or energy as the big task.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    5 Small Tasks (Priority C)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Five quick tasks that can be completed in 15 minutes or less each.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Why it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                    <li>Provides structure without overwhelming you</li>
                    <li>Ensures you tackle big projects while handling daily tasks</li>
                    <li>Creates a sense of accomplishment as you check off items</li>
                    <li>Limits decision fatigue by pre-planning your day</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Pro tip:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    If you don&apos;t have exactly 9 tasks, that&apos;s okay! The rule is a guideline, not a requirement. The key is balancing big, medium, and small tasks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
