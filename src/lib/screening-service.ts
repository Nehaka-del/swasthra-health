import type { Beneficiary, ModelPrediction, Questionnaire, RiskLevel } from "./types";

/**
 * Single integration point for the SWASTHRA anaemia screening model.
 *
 * Production backend (Python / FastAPI on Render):
 *   POST {API_BASE}/predict     multipart/form-data
 *     image: File               conjunctiva image
 *     metadata: JSON string     { age, gender, pregnancy, prior_anemia, symptoms[] }
 *   -> 200 {
 *        anemia_probability: number,   // binary classifier output, NOT haemoglobin
 *        visual_risk: "low"|"moderate"|"high",
 *        threshold: number,
 *        model: string,
 *        screening_only: true,
 *        metadata_received: {}
 *      }
 *
 * The model is a binary anaemia classifier. It does not estimate haemoglobin
 * concentration, so no Hb value is ever shown or derived from its output.
 *
 * Override the base URL with VITE_ML_API_URL if the backend moves.
 */
const API_BASE =
  (import.meta.env["VITE_ML_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
  "https://swasthra-anemia-api.onrender.com";

export interface PredictInput {
  imageDataUrl: string;
  beneficiary: Beneficiary;
  questionnaire: Questionnaire;
}

export const modelMode: "api" = "api";

export const SCREENING_UNAVAILABLE =
  "AI screening service is temporarily unavailable. Please try again.";

const VALID_RISKS: RiskLevel[] = ["low", "moderate", "high"];

/**
 * Sends the captured image to the real screening service.
 * Throws SCREENING_UNAVAILABLE on any network/API failure — the app never
 * fabricates a result when the service cannot be reached.
 */
export async function predictAnemia(input: PredictInput): Promise<ModelPrediction> {
  let blob: Blob;
  try {
    blob = await (await fetch(input.imageDataUrl)).blob();
  } catch {
    throw new Error("Could not read the captured image. Please capture again.");
  }

  const form = new FormData();
  form.append("image", blob, "conjunctiva.jpg");
  form.append(
    "metadata",
    JSON.stringify({
      age: input.beneficiary.age,
      gender: "F",
      pregnancy: input.beneficiary.pregnant,
      prior_anemia: input.beneficiary.priorAnemia,
      symptoms: input.questionnaire.symptoms,
    }),
  );

  // No artificial timeout: the Render free tier can take tens of seconds to
  // wake after inactivity, and that first slow response is still a valid one.
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/predict`, { method: "POST", body: form });
  } catch {
    throw new Error(SCREENING_UNAVAILABLE);
  }
  if (!res.ok) throw new Error(SCREENING_UNAVAILABLE);

  let json: {
    anemia_probability?: unknown;
    visual_risk?: unknown;
    threshold?: unknown;
    model?: unknown;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error(SCREENING_UNAVAILABLE);
  }

  const probability = Number(json.anemia_probability);
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error(SCREENING_UNAVAILABLE);
  }
  const visualRisk = VALID_RISKS.includes(json.visual_risk as RiskLevel)
    ? (json.visual_risk as RiskLevel)
    : probability >= 0.5
      ? "high"
      : "low";

  return {
    anemiaProbability: probability,
    visualRisk,
    ...(typeof json.threshold === "number" ? { threshold: json.threshold } : {}),
    ...(typeof json.model === "string" ? { model: json.model } : {}),
    source: "api",
  };
}
