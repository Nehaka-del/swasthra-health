import { Link, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { beneficiaryName, formatDate } from "@/lib/selectors";
import { useAppState } from "@/lib/store";
import type { RiskLevel } from "@/lib/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Screening history — SWASTHRA" },
      {
        name: "description",
        content: "Search and filter every anaemia screening you have recorded, by name, village or risk band.",
      },
      { property: "og:title", content: "Screening history — SWASTHRA" },
      {
        property: "og:description",
        content: "Search and filter every recorded anaemia screening.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

function History() {
  const state = useAppState();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.screenings
      .filter((s) => filter === "all" || s.risk === filter)
      .filter((s) => {
        if (!term) return true;
        const b = state.beneficiaries.find((x) => x.id === s.beneficiaryId);
        return (
          b?.name.toLowerCase().includes(term) ||
          b?.village.toLowerCase().includes(term) ||
          formatDate(s.createdAt).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [state, q, filter]);

  return (
    <AppShell title="Screening history">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="h-12 pl-9"
          placeholder="Search by name, village or date"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {(["all", "high", "moderate", "low"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            className="h-11 capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No screenings match this search.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id}>
              <Link to="/beneficiaries/$id" params={{ id: s.beneficiaryId }}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{beneficiaryName(state, s.beneficiaryId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(s.createdAt)} · {s.hbRangeLow}–{s.hbRangeHigh} g/dL · score{" "}
                        {s.riskScore}
                      </p>
                    </div>
                    <RiskBadge risk={s.risk} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
