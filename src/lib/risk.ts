import type { Beneficiary, ModelPrediction, Questionnaire, RiskLevel } from "./types";

export interface RiskOutcome {
  risk: RiskLevel;
  score: number;
  factors: string[];
  hbRangeLow: number;
  hbRangeHigh: number;
}

/**
 * Multi-factor preliminary risk engine.
 * Combines the image-derived haemoglobin estimate with questionnaire and
 * demographic factors. Output is a screening signal only — never a diagnosis.
 */
export function assessRisk(
  beneficiary: Beneficiary,
  q: Questionnaire,
  prediction: ModelPrediction,
): RiskOutcome {
  const factors: string[] = [];
  let score = 0;

  const hb = prediction.hemoglobinEstimate;
  const threshold = beneficiary.pregnant ? 11 : 12;

  if (hb < threshold - 2) {
    score += 55;
    factors.push(`Estimated haemoglobin ${hb.toFixed(1)} g/dL is well below ${threshold} g/dL`);
  } else if (hb < threshold) {
    score += 35;
    factors.push(`Estimated haemoglobin ${hb.toFixed(1)} g/dL is below ${threshold} g/dL`);
  } else if (hb < threshold + 0.7) {
    score += 15;
    factors.push(`Estimated haemoglobin ${hb.toFixed(1)} g/dL is close to the cut-off`);
  } else {
    factors.push(`Estimated haemoglobin ${hb.toFixed(1)} g/dL is within the expected range`);
  }

  if (beneficiary.pregnant) {
    score += 10;
    factors.push("Currently pregnant — higher iron requirement");
  }
  if (beneficiary.priorAnemia) {
    score += 8;
    factors.push("History of anaemia");
  }
  if (beneficiary.age < 19) {
    score += 5;
    factors.push("Adolescent age group");
  }

  const symptomCount = q.symptoms.length;
  if (symptomCount >= 4) {
    score += 14;
    factors.push(`${symptomCount} anaemia-related symptoms reported`);
  } else if (symptomCount >= 2) {
    score += 8;
    factors.push(`${symptomCount} anaemia-related symptoms reported`);
  }

  if (q.dietIronRich === "rarely") {
    score += 10;
    factors.push("Iron-rich foods eaten rarely");
  } else if (q.dietIronRich === "sometimes") {
    score += 4;
  }

  if (q.heavyMenstrualBleeding) {
    score += 9;
    factors.push("Heavy menstrual bleeding reported");
  }
  if (q.recentIllness) {
    score += 4;
    factors.push("Recent illness or infection");
  }
  if (q.supplementsTaken) {
    score -= 5;
    factors.push("Already taking iron/folic acid supplements");
  }
  if (q.fatigueLevel >= 7) {
    score += 8;
    factors.push(`High reported fatigue (${q.fatigueLevel}/10)`);
  }

  if (prediction.confidence < 0.7) {
    factors.push("Model confidence is limited — repeat capture advised");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const risk: RiskLevel = score >= 55 ? "high" : score >= 28 ? "moderate" : "low";
  const spread = prediction.confidence > 0.85 ? 0.6 : 1.1;

  return {
    risk,
    score,
    factors,
    hbRangeLow: Math.round((hb - spread) * 10) / 10,
    hbRangeHigh: Math.round((hb + spread) * 10) / 10,
  };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low preliminary risk",
  moderate: "Moderate preliminary risk",
  high: "High preliminary risk",
};

export const RISK_ACTION: Record<RiskLevel, string> = {
  low: "No referral needed now. Share diet and supplement counselling and re-screen in 3 months.",
  moderate:
    "Advise iron-folic acid supplementation, counsel on diet, and schedule a follow-up within 4 weeks. Confirm with a lab haemoglobin test where possible.",
  high: "Refer to the nearest health facility for a confirmatory laboratory haemoglobin test as soon as possible.",
};

export const DISCLAIMER =
  "SWASTHRA is a non-invasive screening aid, not a diagnostic device. Results are preliminary and must be confirmed by a laboratory haemoglobin test before any treatment decision.";
