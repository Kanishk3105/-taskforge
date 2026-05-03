"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/http";
import { CreateProjectDialog } from "@/components/create-project-dialog";

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  role: "admin" | "member";
  createdAt: string;
};

export default function ProjectsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () =>
      apiFetch<{ projects: ProjectRow[] }>("/api/projects", { method: "GET" }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Spaces where your team plans and ships work.
          </p>
        </div>
        <CreateProjectDialog onCreated={() => void refetch()} />
      </div>
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl border border-white/5" />
          ))}
        </div>
      )}
      {!isLoading && data?.projects.length === 0 && (
        <Card className="border-dashed border-white/15 bg-card/40">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create a project to invite teammates and track tasks on a Kanban
              board.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProjectDialog
              onCreated={() => void refetch()}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  New project
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.projects.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/projects/${p.id}`}>
              <Card className="h-full border-white/10 bg-card/60 transition hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">{p.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {p.role}
                    </Badge>
                  </div>
                  {p.description ? (
                    <CardDescription className="line-clamp-2">
                      {p.description}
                    </CardDescription>
                  ) : (
                    <CardDescription className="italic text-muted-foreground/70">
                      No description
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>Updated {new Date(p.createdAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
