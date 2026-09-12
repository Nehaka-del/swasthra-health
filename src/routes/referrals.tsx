import { Link, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { beneficiaryName, formatDate } from "@/lib/selectors";
import { setReferralStatus, useAppState } from "@/lib/store";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referral tracking — SWASTHRA" },
      {
        name: "description",
        content: "Track every referral you raised to a health facility, from pending to completed.",
      },
      { property: "og:title", content: "Referral tracking — SWASTHRA" },
      {
        property: "og:description",
        content: "Track referrals to health facilities from pending to completed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Referrals,
});

const STATUSES = ["pending", "completed", "declined"] as const;

function Referrals() {
  const state = useAppState();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | (typeof STATUSES)[number]>("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.referrals
      .filter((r) => status === "all" || r.status === status)
      .filter(
        (r) =>
          !term ||
          beneficiaryName(state, r.beneficiaryId).toLowerCase().includes(term) ||
          r.facility.toLowerCase().includes(term),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [state, q, status]);

  return (
    <AppShell title="Referrals">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="h-12 pl-9"
          placeholder="Search by name or facility"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            className="h-11 capitalize"
            onClick={() => setStatus(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No referrals here yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/beneficiaries/$id"
                        params={{ id: r.beneficiaryId }}
                        className="font-semibold text-primary"
                      >
                        {beneficiaryName(state, r.beneficiaryId)}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {r.facility} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">
                      {r.urgency} · {r.status}
                    </span>
                  </div>
                  {r.notes && <p className="mt-2 text-sm">{r.notes}</p>}
                  {r.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="h-11"
                        onClick={() => {
                          setReferralStatus(r.id, "completed");
                          toast.success("Referral marked completed");
                        }}
                      >
                        Completed
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11"
                        onClick={() => setReferralStatus(r.id, "declined")}
                      >
                        Declined
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
