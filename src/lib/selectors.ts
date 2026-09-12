import type { AppState, FollowUp, Referral, Screening } from "./types";

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  );
}

export function withinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 86400000;
}

export function dashboardStats(s: AppState) {
  const today = s.screenings.filter((x) => isToday(x.createdAt)).length;
  const week = s.screenings.filter((x) => withinDays(x.createdAt, 7)).length;
  const risk = { low: 0, moderate: 0, high: 0 };
  s.screenings.forEach((x) => (risk[x.risk] += 1));
  return {
    today,
    week,
    total: s.screenings.length,
    beneficiaries: s.beneficiaries.length,
    risk,
    pendingReferrals: s.referrals.filter((r) => r.status === "pending").length,
    dueFollowUps: dueFollowUps(s).length,
  };
}

export function dueFollowUps(s: AppState): FollowUp[] {
  return s.followUps
    .filter((f) => f.status === "scheduled" && new Date(f.dueDate).getTime() <= Date.now() + 7 * 86400000)
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
}

export function beneficiaryName(s: AppState, id: string) {
  return s.beneficiaries.find((b) => b.id === id)?.name ?? "Unknown";
}

export function latestScreening(s: AppState, beneficiaryId: string): Screening | undefined {
  return s.screenings
    .filter((x) => x.beneficiaryId === beneficiaryId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
}

export interface Notification {
  id: string;
  kind: "followup" | "referral" | "highrisk";
  title: string;
  body: string;
  at: string;
  beneficiaryId: string;
}

export function notifications(s: AppState): Notification[] {
  const items: Notification[] = [];

  dueFollowUps(s).forEach((f) => {
    const overdue = new Date(f.dueDate).getTime() < Date.now();
    items.push({
      id: `n_${f.id}`,
      kind: "followup",
      title: `${overdue ? "Overdue" : "Upcoming"} follow-up — ${beneficiaryName(s, f.beneficiaryId)}`,
      body: f.reason,
      at: f.dueDate,
      beneficiaryId: f.beneficiaryId,
    });
  });

  s.referrals
    .filter((r: Referral) => r.status === "pending")
    .forEach((r) =>
      items.push({
        id: `n_${r.id}`,
        kind: "referral",
        title: `Referral pending — ${beneficiaryName(s, r.beneficiaryId)}`,
        body: `${r.facility} · ${r.urgency}`,
        at: r.createdAt,
        beneficiaryId: r.beneficiaryId,
      }),
    );

  s.screenings
    .filter(
      (x) =>
        x.risk === "high" &&
        !s.referrals.some((r) => r.screeningId === x.id) &&
        withinDays(x.createdAt, 30),
    )
    .forEach((x) =>
      items.push({
        id: `n_${x.id}`,
        kind: "highrisk",
        title: `High-risk result without referral — ${beneficiaryName(s, x.beneficiaryId)}`,
        body: "Create a referral to the nearest facility.",
        at: x.createdAt,
        beneficiaryId: x.beneficiaryId,
      }),
    );

  return items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function relativeDays(iso: string) {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;
}
