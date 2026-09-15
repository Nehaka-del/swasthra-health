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
  /** Binary classifier output: probability of anaemia (0–1). NOT a haemoglobin value. */
  anemiaProbability: number;
  /** Model's own visual classification band. */
  visualRisk: RiskLevel;
  /** Decision threshold reported by the model, if provided. */
  threshold?: number;
  /** Model identifier reported by the API, e.g. "SWASTHRA-MobileNetV2-v1". */
  model?: string;
  source: "api";
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
