"use client";

import { isValidElement, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { apiFetch, ApiError } from "@/lib/http";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000),
});

type Form = z.infer<typeof schema>;

export function CreateProjectDialog({
  onCreated,
  trigger,
}: {
  onCreated: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: Form) {
    try {
      await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Project created");
      setOpen(false);
      form.reset({ name: "", description: "" });
      onCreated();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Could not create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isValidElement(trigger) ? (
            trigger
          ) : (
            <Button type="button">
              <Plus className="size-4" />
              New project
            </Button>
          )
        }
      />
      <DialogContent className="border-white/10 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            You will be the admin and can invite teammates by email.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" placeholder="Product launch" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdesc">Description (optional)</Label>
            <Textarea
              id="pdesc"
              rows={3}
              placeholder="What is this project about?"
              {...form.register("description")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
