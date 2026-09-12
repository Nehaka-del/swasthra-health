import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, latestScreening } from "@/lib/selectors";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/beneficiaries/")({
  head: () => ({
    meta: [
      { title: "Beneficiary directory — SWASTHRA" },
      {
        name: "description",
        content: "Search registered women by name, village or health ID and open their screening history.",
      },
      { property: "og:title", content: "Beneficiary directory — SWASTHRA" },
      {
        property: "og:description",
        content: "Search registered women and open their screening history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const state = useAppState();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.beneficiaries.filter(
      (b) =>
        !term ||
        b.name.toLowerCase().includes(term) ||
        b.village.toLowerCase().includes(term) ||
        b.healthId.toLowerCase().includes(term) ||
        b.phone.includes(term),
    );
  }, [state.beneficiaries, q]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Beneficiaries</h1>
        <Button asChild className="h-12">
          <Link to="/beneficiaries/new">
            <Plus className="size-4" aria-hidden /> Register
          </Link>
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="h-12 pl-9"
          placeholder="Search name, village, health ID or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No beneficiaries found. Register one to get started.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((b) => {
            const last = latestScreening(state, b.id);
            return (
              <li key={b.id}>
                <Link to="/beneficiaries/$id" params={{ id: b.id }}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary">
                        {b.name.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{b.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {b.age} yrs · {b.village}
                          {b.pregnant ? " · pregnant" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {last ? `Last screened ${formatDate(last.createdAt)}` : "Not screened yet"}
                        </p>
                      </div>
                      {last && <RiskBadge risk={last.risk} />}
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
