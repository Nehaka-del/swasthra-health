import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { beneficiaryName, formatDate, relativeDays } from "@/lib/selectors";
import { setFollowUpStatus, useAppState } from "@/lib/store";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-up reminders — SWASTHRA" },
      {
        name: "description",
        content: "See which women are due for re-screening or a lab report check, and mark visits done.",
      },
      { property: "og:title", content: "Follow-up reminders — SWASTHRA" },
      {
        property: "og:description",
        content: "See who is due for re-screening and mark visits done.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FollowUps,
});

const TABS = ["scheduled", "done", "missed"] as const;

function FollowUps() {
  const state = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("scheduled");

  const rows = useMemo(
    () =>
      state.followUps
        .filter((f) => f.status === tab)
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)),
    [state.followUps, tab],
  );

  return (
    <AppShell title="Follow-ups">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            className="h-11 capitalize"
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nothing {tab} right now.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((f) => {
            const overdue = f.status === "scheduled" && new Date(f.dueDate).getTime() < Date.now();
            return (
              <li key={f.id}>
                <Card className={overdue ? "border-risk-high/40" : undefined}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CalendarClock
                        className={overdue ? "mt-1 size-5 text-risk-high" : "mt-1 size-5 text-primary"}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/beneficiaries/$id"
                          params={{ id: f.beneficiaryId }}
                          className="font-semibold text-primary"
                        >
                          {beneficiaryName(state, f.beneficiaryId)}
                        </Link>
                        <p className="text-sm">{f.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          Due {formatDate(f.dueDate)} ({relativeDays(f.dueDate)})
                          {overdue ? " · overdue" : ""}
                        </p>
                      </div>
                    </div>
                    {f.status === "scheduled" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          className="h-11"
                          onClick={() => {
                            setFollowUpStatus(f.id, "done");
                            toast.success("Follow-up completed");
                          }}
                        >
                          Mark done
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11"
                          onClick={() => setFollowUpStatus(f.id, "missed")}
                        >
                          Missed
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
