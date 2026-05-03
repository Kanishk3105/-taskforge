"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { apiFetch, ApiError } from "@/lib/http";
import type { MemberRow } from "@/components/project-members";

const schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000),
  dueDate: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
  assignedTo: z.string().min(1),
});

type Form = z.infer<typeof schema>;

export function CreateTaskDialog({
  projectId,
  members,
}: {
  projectId: string;
  members: MemberRow[];
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      status: "todo",
      assignedTo: "",
    },
  });

  useEffect(() => {
    if (!open || members.length === 0) return;
    const current = form.getValues("assignedTo");
    if (!current) {
      form.setValue("assignedTo", members[0].userId);
    }
  }, [open, members, form]);

  const mutation = useMutation({
    mutationFn: (body: Form) =>
      apiFetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...body,
          dueDate: new Date(body.dueDate).toISOString(),
        }),
      }),
    onSuccess: () => {
      toast.success("Task created");
      setOpen(false);
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        status: "todo",
        assignedTo: members[0]?.userId ?? "",
      });
      void qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      void qc.invalidateQueries({ queryKey: ["dashboard", projectId] });
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not create task");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <Plus className="size-4" />
            New task
          </Button>
        }
      />
      <DialogContent className="border-white/10 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Assign to a teammate and set priority, due date, and lane.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="space-y-2">
            <Label htmlFor="ttitle">Title</Label>
            <Input id="ttitle" {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tdesc">Description</Label>
            <Textarea id="tdesc" rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tdue">Due</Label>
            <Input id="tdue" type="datetime-local" {...form.register("dueDate")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as Form["priority"])
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
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as Form["status"])
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
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              value={form.watch("assignedTo")}
              onValueChange={(v) => form.setValue("assignedTo", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick teammate" />
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
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
