import { useSyncExternalStore } from "react";

import type {
  AppState,
  Beneficiary,
  Chw,
  FollowUp,
  Referral,
  Screening,
} from "./types";

const KEY = "swasthra.state.v2";

const EMPTY: AppState = {
  chw: null,
  beneficiaries: [],
  screenings: [],
  referrals: [],
  followUps: [],
  readNotificationIds: [],
};

let state: AppState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — keep working in memory */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as AppState) };
  } catch {
    state = EMPTY;
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function set(next: Partial<AppState>) {
  state = { ...state, ...next };
  persist();
  emit();
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/* ---------------------------------- auth --------------------------------- */

export function signIn(chw: Omit<Chw, "id" | "demo">) {
  set({ chw: { ...chw, id: uid("chw"), demo: false } });
}

export function startDemo() {
  const seed = buildSeed();
  state = { ...EMPTY, ...seed };
  persist();
  emit();
}

export function signOut() {
  state = EMPTY;
  persist();
  emit();
}

/* -------------------------------- mutations ------------------------------- */

export function addBeneficiary(b: Omit<Beneficiary, "id" | "createdAt">): Beneficiary {
  const record: Beneficiary = { ...b, id: uid("ben"), createdAt: new Date().toISOString() };
  set({ beneficiaries: [record, ...state.beneficiaries] });
  return record;
}

export function addScreening(s: Omit<Screening, "id" | "createdAt">): Screening {
  const record: Screening = { ...s, id: uid("scr"), createdAt: new Date().toISOString() };
  set({ screenings: [record, ...state.screenings] });
  return record;
}

export function addReferral(r: Omit<Referral, "id" | "createdAt" | "status">): Referral {
  const record: Referral = {
    ...r,
    id: uid("ref"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  set({ referrals: [record, ...state.referrals] });
  return record;
}

export function setReferralStatus(id: string, status: Referral["status"]) {
  set({ referrals: state.referrals.map((r) => (r.id === id ? { ...r, status } : r)) });
}

export function addFollowUp(f: Omit<FollowUp, "id" | "createdAt" | "status">): FollowUp {
  const record: FollowUp = {
    ...f,
    id: uid("fup"),
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  set({ followUps: [record, ...state.followUps] });
  return record;
}

export function setFollowUpStatus(id: string, status: FollowUp["status"]) {
  set({ followUps: state.followUps.map((f) => (f.id === id ? { ...f, status } : f)) });
}

export function markNotificationRead(id: string) {
  if (state.readNotificationIds.includes(id)) return;
  set({ readNotificationIds: [...state.readNotificationIds, id] });
}

export function markAllNotificationsRead(ids: string[]) {
  set({ readNotificationIds: Array.from(new Set([...state.readNotificationIds, ...ids])) });
}

/* --------------------------------- seed ---------------------------------- */

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function daysAhead(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

function buildSeed(): Partial<AppState> {
  const chw: Chw = {
    id: "chw_demo",
    name: "Asha Patil",
    phone: "+91 98765 43210",
    area: "Wardha Block, Maharashtra",
    employeeId: "ASHA-2291",
    demo: true,
  };

  const people: Array<[string, number, string, boolean, boolean]> = [
    ["Sunita Deshmukh", 27, "Kanhapur", true, false],
    ["Rekha Jadhav", 34, "Kanhapur", false, true],
    ["Meena Kamble", 19, "Salod", false, false],
    ["Pooja Ingle", 23, "Salod", true, true],
    ["Kavita Thorat", 41, "Pipri", false, false],
    ["Anjali More", 17, "Pipri", false, true],
    ["Shalini Raut", 30, "Kanhapur", false, false],
  ];

  const beneficiaries: Beneficiary[] = people.map(
    ([name, age, village, pregnant, priorAnemia], i) => ({
      id: `ben_demo${i}`,
      name,
      age,
      phone: `+91 9${(800000000 + i * 137911).toString()}`,
      village,
      healthId: `MH-ANM-${4100 + i}`,
      pregnant,
      ...(pregnant ? { trimester: (((i % 3) + 1).toString() as "1" | "2" | "3") } : {}),
      priorAnemia,
      createdAt: daysAgo(40 - i * 4),
    }),
  );

  const plan: Array<[number, number, number]> = [
    // [beneficiary index, days ago, AI anaemia probability]
    [0, 1, 0.84],
    [1, 2, 0.58],
    [2, 3, 0.18],
    [3, 5, 0.91],
    [4, 9, 0.12],
    [5, 12, 0.66],
    [6, 20, 0.24],
    [0, 30, 0.79],
  ];

  const screenings: Screening[] = plan.map(([bi, ago, probability], i) => {
    const b = beneficiaries[bi]!;
    const threshold = b.pregnant ? 0.4 : 0.5;
    const risk: Screening["risk"] =
      probability >= threshold + 0.3
        ? "high"
        : probability >= threshold
          ? "moderate"
          : "low";
    const score = risk === "high" ? 68 : risk === "moderate" ? 40 : 14;
    return {
      id: `scr_demo${i}`,
      beneficiaryId: b.id,
      chwId: chw.id,
      createdAt: daysAgo(ago),
      questionnaire: {
        symptoms: risk === "low" ? ["Tiredness"] : ["Tiredness", "Dizziness", "Breathlessness"],
        dietIronRich: risk === "high" ? "rarely" : "sometimes",
        heavyMenstrualBleeding: !b.pregnant && risk !== "low",
        recentIllness: false,
        supplementsTaken: b.pregnant,
        fatigueLevel: risk === "high" ? 8 : risk === "moderate" ? 5 : 2,
      },
      quality: {
        score: 82,
        brightness: 85,
        sharpness: 80,
        framing: 80,
        passed: true,
        issues: [],
      },
      prediction: {
        anemiaProbability: probability,
        visualRisk: risk,
        model: "SWASTHRA-MobileNetV2-v1",
        source: "api",
      },
      risk,
      riskScore: score,
      factors: [
        `AI screening signal: ${Math.round(probability * 100)}% anaemia probability (${risk} visual band)`,
      ],
    };
  });

  const referrals: Referral[] = [
    {
      id: "ref_demo0",
      beneficiaryId: beneficiaries[3]!.id,
      screeningId: "scr_demo3",
      facility: "Wardha Primary Health Centre",
      urgency: "urgent",
      notes: "Pregnant, second trimester. Confirmatory CBC advised.",
      status: "pending",
      createdAt: daysAgo(5),
    },
    {
      id: "ref_demo1",
      beneficiaryId: beneficiaries[0]!.id,
      screeningId: "scr_demo0",
      facility: "Wardha Primary Health Centre",
      urgency: "priority",
      notes: "Repeat low estimate across two screenings.",
      status: "pending",
      createdAt: daysAgo(1),
    },
    {
      id: "ref_demo2",
      beneficiaryId: beneficiaries[5]!.id,
      screeningId: "scr_demo5",
      facility: "Sub-centre Pipri",
      urgency: "routine",
      notes: "Adolescent, IFA counselling given.",
      status: "completed",
      createdAt: daysAgo(12),
    },
  ];

  const followUps: FollowUp[] = [
    {
      id: "fup_demo0",
      beneficiaryId: beneficiaries[1]!.id,
      screeningId: "scr_demo1",
      dueDate: daysAgo(2),
      reason: "Re-screen after 4 weeks of IFA supplementation",
      status: "scheduled",
      createdAt: daysAgo(30),
    },
    {
      id: "fup_demo1",
      beneficiaryId: beneficiaries[3]!.id,
      screeningId: "scr_demo3",
      dueDate: daysAhead(3),
      reason: "Check lab report after referral",
      status: "scheduled",
      createdAt: daysAgo(5),
    },
    {
      id: "fup_demo2",
      beneficiaryId: beneficiaries[5]!.id,
      dueDate: daysAhead(14),
      reason: "Routine adolescent re-screening",
      status: "scheduled",
      createdAt: daysAgo(12),
    },
  ];

  return { chw, beneficiaries, screenings, referrals, followUps, readNotificationIds: [] };
}
