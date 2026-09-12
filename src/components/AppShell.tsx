import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  ClipboardList,
  Droplet,
  Home,
  LogOut,
  Send,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/selectors";
import { signOut, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/beneficiaries", label: "People", Icon: Users },
  { to: "/history", label: "History", Icon: ClipboardList },
  { to: "/referrals", label: "Referrals", Icon: Send },
  { to: "/follow-ups", label: "Follow-ups", Icon: CalendarClock },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const state = useAppState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = notifications(state).filter(
    (n) => !state.readNotificationIds.includes(n.id),
  ).length;

  useEffect(() => {
    if (!state.chw) navigate({ to: "/sign-in" });
  }, [state.chw, navigate]);


  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Droplet className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">SWASTHRA</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative size-11">
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-clay text-[10px] font-bold text-clay-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="Sign out"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>

        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 md:flex">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(to)
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {title && <h1 className="mb-4 text-2xl font-bold">{title}</h1>}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                pathname.startsWith(to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
