"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Kanban, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.35_0.08_180),transparent)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.12_0.02_250))]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Kanban className="size-5" />
          </span>
          Taskforge
        </div>
        <div className="flex gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Log in
          </Link>
          <Link href="/signup" className={cn(buttonVariants())}>
            Get started
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 md:flex-row md:items-center md:pt-16">
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <Sparkles className="size-3.5 text-primary" />
            Team Task Manager — full-stack assessment
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.1]"
          >
            Ship tasks together with{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300/90 bg-clip-text text-transparent">
              clarity and pace
            </span>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl text-lg text-muted-foreground"
          >
            Projects, roles, Kanban boards, and a live dashboard — built for
            teams that need structure without the bloat.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              I already have an account
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="flex-1"
        >
          <div className="relative rounded-2xl border border-white/10 bg-card/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mb-4 flex gap-2">
              {["To do", "In progress", "Done"].map((c) => (
                <div
                  key={c}
                  className="flex-1 rounded-lg border border-white/5 bg-background/40 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/5 bg-primary/5 p-3 text-xs text-foreground/90"
                >
                  <div className="mb-2 h-2 w-3/4 rounded bg-white/10" />
                  <div className="h-2 w-1/2 rounded bg-white/5" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
