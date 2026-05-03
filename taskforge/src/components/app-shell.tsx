"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Kanban, LayoutDashboard, LogOut, Menu, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { apiFetch } from "@/lib/http";
import { toast } from "sonner";

const nav = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function AppShell({
  user,
  children,
}: {
  user: { id: string; name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    }
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("flex gap-1", mobile ? "flex-col" : "flex-col px-2")}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link key={href} href={href}>
            <span
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-sidebar/80 backdrop-blur md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Kanban className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Taskforge</p>
            <p className="text-xs text-muted-foreground">Team workspace</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6 py-6">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start gap-2 px-2 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-background/80 px-4 backdrop-blur md:hidden">
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0",
              )}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-white/10 bg-sidebar p-0">
              <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Kanban className="size-4" />
                </span>
                <span className="font-semibold">Taskforge</span>
              </div>
              <div className="p-3">
                <NavLinks mobile />
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <Button variant="outline" className="mt-2 w-full gap-2" onClick={logout}>
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-medium text-muted-foreground">
            {pathname.startsWith("/projects/") ? "Project" : pathname}
          </span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
