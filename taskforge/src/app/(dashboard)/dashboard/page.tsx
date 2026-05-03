"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { AlertTriangle, LayoutDashboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/http";

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  role: "admin" | "member";
  createdAt: string;
};

type DashboardPayload = {
  scope: "project" | "assigned";
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  tasksPerUser: { userId: string; name: string; email: string; count: number }[];
  overdueTasks: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
    assigneeName: string;
  }[];
};

const STATUS_COLORS = {
  todo: "var(--chart-1)",
  in_progress: "var(--chart-2)",
  done: "var(--chart-3)",
};

export default function DashboardPage() {
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () =>
      apiFetch<{ projects: ProjectRow[] }>("/api/projects", { method: "GET" }),
  });

  const projects = projectsData?.projects ?? [];
  const [projectId, setProjectId] = useState<string | null>(null);

  const selectedId = projectId ?? projects[0]?.id ?? null;

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard", selectedId],
    enabled: !!selectedId,
    queryFn: () =>
      apiFetch<DashboardPayload>(`/api/projects/${selectedId}/dashboard`),
  });

  const pieData = useMemo(() => {
    if (!dash) return [];
    return [
      { name: "To do", value: dash.tasksByStatus.todo, key: "todo" },
      { name: "In progress", value: dash.tasksByStatus.in_progress, key: "in_progress" },
      { name: "Done", value: dash.tasksByStatus.done, key: "done" },
    ].filter((d) => d.value > 0);
  }, [dash]);

  const barData = useMemo(() => {
    if (!dash) return [];
    return dash.tasksPerUser.map((u) => ({
      name: u.name.split(" ")[0] || u.name,
      tasks: u.count,
    }));
  }, [dash]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-primary">
            <LayoutDashboard className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Insights
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Totals, status mix, workload per teammate, and overdue work — scoped to
            a project.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Project</p>
          {projectsLoading ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a project first.</p>
          ) : (
            <Select
              value={selectedId ?? undefined}
              onValueChange={(v) => setProjectId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedId ? null : dashLoading || !dash ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl border border-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-gradient-to-br from-card to-background">
              <CardHeader>
                <CardDescription>Total tasks</CardDescription>
                <CardTitle className="text-4xl font-semibold tabular-nums">
                  {dash.totalTasks}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Scope:{" "}
                <span className="font-medium text-foreground">
                  {dash.scope === "project" ? "Entire project" : "Your assignments"}
                </span>
              </CardContent>
            </Card>
            <Card className="border-white/10 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Status mix</CardTitle>
                <CardDescription>Share of work across lanes.</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                {pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              STATUS_COLORS[entry.key as keyof typeof STATUS_COLORS]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Tasks per teammate</CardTitle>
                <CardDescription>Assigned workload in this project.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {barData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignees yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="tasks" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-amber-400" />
                  Overdue tasks
                </CardTitle>
                <CardDescription>
                  Due before today (UTC) and not marked done.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dash.overdueTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing overdue. Nice work.</p>
                ) : (
                  <ul className="max-h-72 space-y-2 overflow-auto pr-1 text-sm">
                    {dash.overdueTasks.map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-col gap-1 rounded-lg border border-white/10 bg-background/50 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium leading-snug">{t.title}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                            {t.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.assigneeName} · due {format(new Date(t.dueDate), "MMM d, yyyy")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
