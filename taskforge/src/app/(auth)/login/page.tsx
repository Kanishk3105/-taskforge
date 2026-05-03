"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    try {
      await apiFetch<{ user: { id: string; name: string; email: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(values) },
      );
      toast.success("Welcome back");
      router.push("/projects");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  return (
    <Card className="border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Kanban className="size-6" />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Log in to Taskforge
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Use the account you created during signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Continue"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-white/5 pt-6">
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-medium text-primary hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
