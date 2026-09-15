import type { Beneficiary, ModelPrediction, Questionnaire, RiskLevel } from "./types";

export interface RiskOutcome {
  risk: RiskLevel;
  score: number;
  factors: string[];
}

/**
 * Multi-factor preliminary risk engine.
 * Combines the AI image-based anaemia probability with questionnaire and
 * demographic factors. The AI output is a binary screening signal only —
 * never a haemoglobin measurement and never a diagnosis.
 */
export function assessRisk(
  beneficiary: Beneficiary,
  q: Questionnaire,
  prediction: ModelPrediction,
): RiskOutcome {
  const factors: string[] = [];
  let score = 0;

  const probability = prediction.anemiaProbability;
  const pct = Math.round(probability * 100);

  if (probability >= 0.75) {
    score += 55;
    factors.push(`AI screening signal strongly suggests anaemia (${pct}% probability)`);
  } else if (probability >= 0.5) {
    score += 38;
    factors.push(`AI screening signal suggests possible anaemia (${pct}% probability)`);
  } else if (probability >= 0.3) {
    score += 18;
    factors.push(`AI screening signal is borderline (${pct}% probability)`);
  } else {
    factors.push(`AI screening signal suggests no anaemia (${pct}% probability)`);
  }
  if (prediction.visualRisk === "high" && probability < 0.75) {
    score += 8;
    factors.push("Model visual classification flagged high risk");
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

  score = Math.max(0, Math.min(100, Math.round(score)));

  const risk: RiskLevel = score >= 55 ? "high" : score >= 28 ? "moderate" : "low";

  return { risk, score, factors };
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
  "This is a preliminary screening tool and not a medical diagnosis. Confirmatory hemoglobin testing and clinical evaluation are recommended.";
