import type { Beneficiary, ModelPrediction, Questionnaire, RiskLevel } from "./types";

/**
 * Single integration point for the anaemia prediction model.
 *
 * Production contract (Python / FastAPI backend):
 *   POST {BASE_URL}/predict     multipart/form-data
 *     image: File               conjunctiva image
 *     metadata: JSON string     { age, pregnant, prior_anemia, symptoms[] }
 *   -> 200 { hemoglobin_estimate: number, confidence: number, risk: "low"|"moderate"|"high" }
 *
 * Set VITE_ML_API_URL to switch from the bundled mock adapter to the HTTP
 * adapter. No other file needs to change.
 */
const API_BASE = import.meta.env["VITE_ML_API_URL"] as string | undefined;

export interface PredictInput {
  imageDataUrl: string;
  beneficiary: Beneficiary;
  questionnaire: Questionnaire;
}

export const modelMode: "mock" | "api" = API_BASE ? "api" : "mock";

export async function predictAnemia(input: PredictInput): Promise<ModelPrediction> {
  return API_BASE ? httpAdapter(input, API_BASE) : mockAdapter(input);
}

async function httpAdapter(input: PredictInput, base: string): Promise<ModelPrediction> {
  const blob = await (await fetch(input.imageDataUrl)).blob();
  const form = new FormData();
  form.append("image", blob, "conjunctiva.jpg");
  form.append(
    "metadata",
    JSON.stringify({
      age: input.beneficiary.age,
      pregnant: input.beneficiary.pregnant,
      prior_anemia: input.beneficiary.priorAnemia,
      symptoms: input.questionnaire.symptoms,
    }),
  );

  const res = await fetch(`${base.replace(/\/$/, "")}/predict`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Screening service failed (${res.status})`);
  const json = (await res.json()) as {
    hemoglobin_estimate: number;
    confidence: number;
    risk: RiskLevel;
  };
  return {
    hemoglobinEstimate: json.hemoglobin_estimate,
    confidence: json.confidence,
    risk: json.risk,
    source: "api",
  };
}

/** Deterministic, image-derived simulation so demo runs are reproducible. */
async function mockAdapter(input: PredictInput): Promise<ModelPrediction> {
  await new Promise((r) => setTimeout(r, 1400));

  const paleness = await estimatePaleness(input.imageDataUrl);
  const { beneficiary, questionnaire } = input;

  let hb = 14.2 - paleness * 6.5;
  if (beneficiary.pregnant) hb -= 0.7;
  if (beneficiary.priorAnemia) hb -= 0.5;
  hb -= Math.min(questionnaire.symptoms.length, 5) * 0.25;
  if (questionnaire.dietIronRich === "rarely") hb -= 0.5;
  hb = Math.max(5.5, Math.min(15.5, Math.round(hb * 10) / 10));

  const threshold = beneficiary.pregnant ? 11 : 12;
  const risk: RiskLevel = hb < threshold - 1.5 ? "high" : hb < threshold ? "moderate" : "low";
  const confidence = Math.round((0.72 + Math.min(0.24, paleness * 0.3)) * 100) / 100;

  return { hemoglobinEstimate: hb, confidence, risk, source: "mock" };
}

/** Redness ratio of the central region → proxy for conjunctival pallor (0 = red, 1 = pale). */
async function estimatePaleness(dataUrl: string): Promise<number> {
  if (typeof document === "undefined") return 0.4;
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.4;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(size * 0.25, size * 0.25, size * 0.5, size * 0.5);

  let r = 0;
  let g = 0;
  let b = 0;
  const px = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]!;
    g += data[i + 1]!;
    b += data[i + 2]!;
  }
  r /= px;
  g /= px;
  b /= px;
  const total = r + g + b || 1;
  const redRatio = r / total; // ~0.33 neutral, higher = redder
  const paleness = clamp01((0.45 - redRatio) / 0.17);
  return paleness;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the captured image"));
    img.src = src;
  });
}
