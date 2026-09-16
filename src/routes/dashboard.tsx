import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Plus, ScanEye, Send, Users } from "lucide-react";

import heroAsset from "@/assets/dashboard-hero.jpeg.asset.json";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { beneficiaryName, dashboardStats, formatDate, relativeDays, dueFollowUps } from "@/lib/selectors";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Field dashboard — SWASTHRA" },
      {
        name: "description",
        content:
          "Live screening counts, risk breakdown, pending referrals and due follow-ups for your area.",
      },
      { property: "og:title", content: "Field dashboard — SWASTHRA" },
      {
        property: "og:description",
        content: "Live screening counts, risk breakdown, referrals and follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useAppState();
  const stats = dashboardStats(state);
  const recent = state.screenings.slice(0, 5);
  const due = dueFollowUps(state).slice(0, 3);

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">Namaste,</p>
        <h1 className="text-2xl font-bold">{state.chw?.name ?? "Health worker"}</h1>
        <p className="text-sm text-muted-foreground">{state.chw?.area}</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="h-14 justify-start text-base">
          <Link to="/screening">
            <ScanEye className="size-5" aria-hidden /> New screening
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 justify-start text-base">
          <Link to="/beneficiaries/new">
            <Plus className="size-5" aria-hidden /> Register beneficiary
          </Link>
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Screenings today" value={stats.today} Icon={ScanEye} />
        <Stat label="This week" value={stats.week} Icon={ClipboardList} />
        <Stat label="Beneficiaries" value={stats.beneficiaries} Icon={Users} />
        <Stat label="Pending referrals" value={stats.pendingReferrals} Icon={Send} />
      </div>

      <Card className="mb-5">
        <CardContent className="p-5">
          <h2 className="mb-3 text-base font-semibold">Risk breakdown ({stats.total} screenings)</h2>
          <div className="space-y-3">
            {(["high", "moderate", "low"] as const).map((level) => {
              const count = stats.risk[level];
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <RiskBadge risk={level} />
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `var(--risk-${level})`,
                      }}
                    />
                  </div>
                  <span className="w-14 text-right text-sm font-semibold tabular-nums">
                    {count} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {due.length > 0 && (
        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Follow-ups due soon</h2>
              <Link to="/follow-ups" className="text-sm font-medium text-primary">
                View all
              </Link>
            </div>
            <ul className="space-y-2">
              {due.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
                  <CalendarClock className="size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{beneficiaryName(state, f.beneficiaryId)}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {f.reason} · due {relativeDays(f.dueDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent screenings</h2>
            <Link to="/history" className="text-sm font-medium text-primary">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No screenings yet. Start with a new screening above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/beneficiaries/$id"
                    params={{ id: s.beneficiaryId }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{beneficiaryName(state, s.beneficiaryId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(s.createdAt)} · AI probability{" "}
                        {Math.round(s.prediction.anemiaProbability * 100)}%
                      </p>
                    </div>
                    <RiskBadge risk={s.risk} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Disclaimer />
    </AppShell>
  );
}

function Stat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="size-5 text-primary" aria-hidden />
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
