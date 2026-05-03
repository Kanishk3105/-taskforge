"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/http";
import { toast } from "sonner";
import { ProjectMembers, type MemberRow } from "@/components/project-members";
import { TaskPanel, type TaskRow } from "@/components/task-panel";
import { CreateTaskDialog } from "@/components/create-task-dialog";

const columns: { id: TaskRow["status"]; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: { id: string; name: string; email: string } }>("/api/me"),
  });

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () =>
      apiFetch<{
        project: {
          id: string;
          name: string;
          description: string;
          role: "admin" | "member";
          members: MemberRow[];
        };
      }>(`/api/projects/${projectId}`),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () =>
      apiFetch<{ tasks: TaskRow[] }>(`/api/projects/${projectId}/tasks`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskRow["status"] }) =>
      apiFetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      void qc.invalidateQueries({ queryKey: ["dashboard", projectId] });
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not update status");
    },
  });

  const grouped = useMemo(() => {
    const map: Record<string, TaskRow[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasksData?.tasks ?? []) {
      map[t.status]?.push(t);
    }
    return map;
  }, [tasksData]);

  const project = projectData?.project;
  const isAdmin = project?.role === "admin";

  function openTask(t: TaskRow) {
    setActiveTask(t);
    setSheetOpen(true);
  }

  if (projectLoading || !project) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Skeleton className="h-[480px] rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "-ml-2 inline-flex gap-2 text-muted-foreground",
            )}
          >
            <ArrowLeft className="size-4" />
            All projects
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {project.role}
            </Badge>
          </div>
          {project.description ? (
            <p className="max-w-2xl text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
        {isAdmin && (
          <CreateTaskDialog projectId={projectId} members={project.members} />
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Board</h2>
            {tasksLoading && (
              <span className="text-xs text-muted-foreground">Loading tasks…</span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {columns.map((col, ci) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.05 }}
                className="flex min-h-[420px] flex-col rounded-xl border border-white/10 bg-card/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {grouped[col.id]?.length ?? 0}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {(grouped[col.id] ?? []).map((task) => (
                    <div
                      key={task.id}
                      role="presentation"
                      className="rounded-lg border border-white/10 bg-background/60 p-3 text-left text-sm shadow-sm transition hover:border-primary/40 hover:bg-background"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => openTask(task)}
                      >
                        <p className="font-medium leading-snug">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3" />
                            {format(new Date(task.dueDate), "MMM d")}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            <Flag className="mr-1 size-3" />
                            {task.priority}
                          </Badge>
                        </div>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {columns
                          .filter((c) => c.id !== task.status)
                          .map((c) => (
                            <Button
                              key={c.id}
                              type="button"
                              variant="secondary"
                              size="xs"
                              className="h-6 text-[10px]"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({ taskId: task.id, status: c.id })
                              }
                            >
                              {c.label}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                  {(grouped[col.id]?.length ?? 0) === 0 && (
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                      No tasks here yet.
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <ProjectMembers
          projectId={projectId}
          members={project.members}
          isAdmin={!!isAdmin}
          currentUserId={me?.user.id ?? ""}
        />
      </div>
      <TaskPanel
        projectId={projectId}
        task={activeTask}
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setActiveTask(null);
        }}
        isAdmin={!!isAdmin}
        members={project.members}
      />
    </div>
  );
}
