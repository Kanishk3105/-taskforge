"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/http";

const addSchema = z.object({ email: z.string().email() });
type AddForm = z.infer<typeof addSchema>;

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "member";
};

export function ProjectMembers({
  projectId,
  members,
  isAdmin,
  currentUserId,
}: {
  projectId: string;
  members: MemberRow[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const form = useForm<AddForm>({ resolver: zodResolver(addSchema) });
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      toast.success("Member added");
      form.reset();
      void qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not add member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      toast.success("Member removed");
      void qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e) => {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not remove member");
    },
    onSettled: () => setPendingRemove(null),
  });

  if (!isAdmin) {
    return (
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
          <CardDescription>Members on this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 pr-3">
            <ul className="space-y-2 text-sm">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-background/40 px-3 py-2"
                >
                  <span className="truncate font-medium">{m.name}</span>
                  <Badge variant="outline" className="capitalize">
                    {m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Team & access</CardTitle>
        <CardDescription>Add coworkers by email. Admins manage tasks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={form.handleSubmit((v) => addMutation.mutate(v.email))}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite">Invite by email</Label>
            <Input id="invite" type="email" placeholder="teammate@company.com" {...form.register("email")} />
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            <UserPlus className="size-4" />
            Add
          </Button>
        </form>
        <Separator className="bg-white/10" />
        <ScrollArea className="h-56 pr-3">
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {m.role}
                  </Badge>
                  {m.userId !== currentUserId && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={removeMutation.isPending && pendingRemove === m.userId}
                      onClick={() => {
                        setPendingRemove(m.userId);
                        removeMutation.mutate(m.userId);
                      }}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
