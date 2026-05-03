"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiFetch, ApiError } from "@/lib/http";
import type { MemberRow } from "@/components/project-members";

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  assignedTo: string;
  createdBy: string;
};

const taskFormSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  dueDate: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
  assignedTo: z.string(),
});

type TaskForm = z.infer<typeof taskFormSchema>;

export function TaskPanel({
  projectId,
  task,
  open,
  onOpenChange,
  isAdmin,
  members,
}: {
  projectId: string;
  task: TaskRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isAdmin: boolean;
  members: MemberRow[];
}) {
  const qc = useQueryClient();
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    if (!task || !open) return;
    const due = format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm");
    form.reset({
      title: task.title,
      description: task.description,
      dueDate: due,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
    });
  }, [task, open, form]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/api/projects/${projectId}/tasks/${task?.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Task updated");
      void qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      void qc.invalidateQueries({ queryKey: ["dashboard", projectId] });
      onOpenChange(false);
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not save task");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/projects/${projectId}/tasks/${task!.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Task deleted");
      void qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      void qc.invalidateQueries({ queryKey: ["dashboard", projectId] });
      onOpenChange(false);
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not delete task");
    },
  });

  function onSubmit(values: TaskForm) {
    if (!task) return;
    if (isAdmin && !values.assignedTo) {
      toast.error("Choose an assignee");
      return;
    }
    const body: Record<string, unknown> = {
      title: values.title,
      description: values.description ?? "",
      dueDate: new Date(values.dueDate).toISOString(),
      priority: values.priority,
      status: values.status,
    };
    if (isAdmin && values.assignedTo) {
      body.assignedTo = values.assignedTo;
    }
    saveMutation.mutate(body);
  }

  const priority = form.watch("priority") ?? "medium";
  const status = form.watch("status") ?? "todo";
  const assignee = form.watch("assignedTo") ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-white/10 bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "Task"}</SheetTitle>
          <SheetDescription>
            {isAdmin
              ? "Admins can assign tasks and manage every field."
              : "You can update fields on tasks assigned to you."}
          </SheetDescription>
        </SheetHeader>
        {task && (
          <form
            className="flex flex-1 flex-col gap-4 overflow-y-auto py-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Due</Label>
              <Input type="datetime-local" {...form.register("dueDate")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    form.setValue("priority", v as TaskForm["priority"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    form.setValue("status", v as TaskForm["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={assignee}
                  onValueChange={(v) => form.setValue("assignedTo", v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <SheetFooter className="mt-auto flex-col gap-2 sm:flex-col">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => task && deleteMutation.mutate()}
                >
                  <Trash2 className="size-4" />
                  Delete task
                </Button>
              )}
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
