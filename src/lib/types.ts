export type RiskLevel = "low" | "moderate" | "high";

export interface Chw {
  id: string;
  name: string;
  phone: string;
  area: string;
  employeeId: string;
  demo: boolean;
}

export interface Beneficiary {
  id: string;
  name: string;
  age: number;
  phone: string;
  village: string;
  healthId: string;
  pregnant: boolean;
  trimester?: "1" | "2" | "3";
  priorAnemia: boolean;
  notes?: string;
  createdAt: string;
}

export interface Questionnaire {
  symptoms: string[];
  dietIronRich: "rarely" | "sometimes" | "often";
  heavyMenstrualBleeding: boolean;
  recentIllness: boolean;
  supplementsTaken: boolean;
  fatigueLevel: number; // 0-10
}

export interface ImageQuality {
  score: number; // 0-100
  brightness: number;
  sharpness: number;
  framing: number;
  passed: boolean;
  issues: string[];
}

export interface ModelPrediction {
  hemoglobinEstimate: number;
  confidence: number;
  risk: RiskLevel;
  source: "mock" | "api";
}

export interface Screening {
  id: string;
  beneficiaryId: string;
  chwId: string;
  createdAt: string;
  questionnaire: Questionnaire;
  quality: ImageQuality;
  prediction: ModelPrediction;
  risk: RiskLevel;
  riskScore: number;
  factors: string[];
  hbRangeLow: number;
  hbRangeHigh: number;
  imageDataUrl?: string;
}

export interface Referral {
  id: string;
  beneficiaryId: string;
  screeningId: string;
  facility: string;
  urgency: "routine" | "priority" | "urgent";
  notes: string;
  status: "pending" | "completed" | "declined";
  createdAt: string;
}

export interface FollowUp {
  id: string;
  beneficiaryId: string;
  screeningId?: string;
  dueDate: string;
  reason: string;
  status: "scheduled" | "done" | "missed";
  createdAt: string;
}

export interface AppState {
  chw: Chw | null;
  beneficiaries: Beneficiary[];
  screenings: Screening[];
  referrals: Referral[];
  followUps: FollowUp[];
  readNotificationIds: string[];
}
