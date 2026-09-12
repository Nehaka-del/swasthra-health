import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CalendarClock, Send } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, notifications } from "@/lib/selectors";
import { markAllNotificationsRead, markNotificationRead, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SWASTHRA" },
      {
        name: "description",
        content: "Follow-ups due, pending referrals and high-risk results that still need action.",
      },
      { property: "og:title", content: "Notifications — SWASTHRA" },
      {
        property: "og:description",
        content: "Follow-ups due, pending referrals and unresolved high-risk results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

const ICONS = { followup: CalendarClock, referral: Send, highrisk: AlertTriangle };

function Notifications() {
  const state = useAppState();
  const items = notifications(state);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {items.length > 0 && (
          <Button
            variant="outline"
            className="h-11"
            onClick={() => markAllNotificationsRead(items.map((i) => i.id))}
          >
            Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 size-6" aria-hidden />
            Nothing needs your attention right now.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const Icon = ICONS[n.kind];
            const read = state.readNotificationIds.includes(n.id);
            return (
              <li key={n.id}>
                <Link
                  to="/beneficiaries/$id"
                  params={{ id: n.beneficiaryId }}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <Card className={cn(!read && "border-primary/40 bg-primary-soft/30")}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <Icon
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
                          n.kind === "highrisk" ? "text-risk-high" : "text-primary",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(n.at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
