import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { CalendarClock, Phone, ScanEye, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, relativeDays } from "@/lib/selectors";
import { addFollowUp, setFollowUpStatus, setReferralStatus, useAppState } from "@/lib/store";

export const Route = createFileRoute("/beneficiaries/$id")({
  head: () => ({
    meta: [
      { title: "Beneficiary profile — SWASTHRA" },
      {
        name: "description",
        content: "Screening timeline, risk trend, referrals and follow-ups for a registered woman.",
      },
      { property: "og:title", content: "Beneficiary profile — SWASTHRA" },
      {
        property: "og:description",
        content: "Screening timeline, referrals and follow-ups for a registered woman.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { id } = useParams({ from: "/beneficiaries/$id" });
  const state = useAppState();
  const navigate = useNavigate();
  const b = state.beneficiaries.find((x) => x.id === id);

  const [due, setDue] = useState("");
  const [reason, setReason] = useState("Re-screen and review symptoms");

  if (!b) {
    return (
      <AppShell title="Beneficiary">
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            This beneficiary is not on this device.{" "}
            <Link to="/beneficiaries" className="text-primary">
              Back to directory
            </Link>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const screenings = state.screenings
    .filter((s) => s.beneficiaryId === b.id)
    .sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));
  const referrals = state.referrals.filter((r) => r.beneficiaryId === b.id);
  const followUps = state.followUps.filter((f) => f.beneficiaryId === b.id);

  function scheduleFollowUp() {
    if (!due) {
      toast.error("Pick a follow-up date.");
      return;
    }
    addFollowUp({ beneficiaryId: b!.id, dueDate: new Date(due).toISOString(), reason });
    setDue("");
    toast.success("Follow-up scheduled");
  }

  return (
    <AppShell>
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary">
              {b.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{b.name}</h1>
              <p className="text-sm text-muted-foreground">
                {b.age} yrs · {b.village} · {b.healthId}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {b.pregnant && (
                  <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
                    Pregnant · trimester {b.trimester}
                  </span>
                )}
                {b.priorAnemia && (
                  <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
                    Prior anaemia
                  </span>
                )}
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
                  Registered {formatDate(b.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {b.notes && <p className="mt-4 text-sm text-muted-foreground">{b.notes}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              className="h-12"
              onClick={() => navigate({ to: "/screening", search: { beneficiary: b.id } })}
            >
              <ScanEye className="size-4" aria-hidden /> Screen now
            </Button>
            {b.phone && (
              <Button asChild variant="outline" className="h-12">
                <a href={`tel:${b.phone.replace(/\s/g, "")}`}>
                  <Phone className="size-4" aria-hidden /> Call
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-5">
          <h2 className="mb-3 text-base font-semibold">Screening timeline ({screenings.length})</h2>
          {screenings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No screenings recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {screenings.map((s) => (
                <li key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold tabular-nums">
                        {s.hbRangeLow}–{s.hbRangeHigh} g/dL estimated
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(s.createdAt)} · confidence{" "}
                        {Math.round(s.prediction.confidence * 100)}%
                      </p>
                    </div>
                    <RiskBadge risk={s.risk} />
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {s.factors.slice(0, 3).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Send className="size-4" aria-hidden /> Referrals ({referrals.length})
          </h2>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals raised.</p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{r.facility}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.urgency} · raised {formatDate(r.createdAt)} · {r.status}
                  </p>
                  {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
                  {r.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="h-11"
                        onClick={() => setReferralStatus(r.id, "completed")}
                      >
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11"
                        onClick={() => setReferralStatus(r.id, "declined")}
                      >
                        Declined
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-4" aria-hidden /> Follow-ups ({followUps.length})
          </h2>
          <ul className="mb-4 space-y-2">
            {followUps.map((f) => (
              <li key={f.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{f.reason}</p>
                <p className="text-sm text-muted-foreground">
                  Due {formatDate(f.dueDate)} ({relativeDays(f.dueDate)}) · {f.status}
                </p>
                {f.status === "scheduled" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="h-11" onClick={() => setFollowUpStatus(f.id, "done")}>
                      Mark done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11"
                      onClick={() => setFollowUpStatus(f.id, "missed")}
                    >
                      Missed
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="space-y-3 rounded-xl bg-muted/60 p-4">
            <p className="text-sm font-semibold">Schedule a follow-up</p>
            <div className="space-y-1.5">
              <Label htmlFor="due">Date</Label>
              <Input
                id="due"
                type="date"
                className="h-12"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                className="h-12"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button className="h-12 w-full" onClick={scheduleFollowUp}>
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Disclaimer />
    </AppShell>
  );
}
