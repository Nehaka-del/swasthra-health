import type { ImageQuality } from "./types";

/** On-device quality gate: brightness, blur (Laplacian variance) and framing. */
export async function assessImageQuality(dataUrl: string): Promise<ImageQuality> {
  const fallback: ImageQuality = {
    score: 0,
    brightness: 0,
    sharpness: 0,
    framing: 0,
    passed: false,
    issues: ["Could not read the image. Please capture again."],
  };
  if (typeof document === "undefined") return fallback;

  const img = await loadImage(dataUrl).catch(() => null);
  if (!img) return fallback;

  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const gray = new Float32Array(size * size);
  let sum = 0;
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    const v = 0.299 * data[o]! + 0.587 * data[o + 1]! + 0.114 * data[o + 2]!;
    gray[i] = v;
    sum += v;
  }
  const mean = sum / gray.length;

  // Laplacian variance → sharpness
  let lapSum = 0;
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const lap =
        4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - size]! - gray[i + size]!;
      lapSum += lap;
      lapSq += lap * lap;
      count++;
    }
  }
  const lapMean = lapSum / count;
  const lapVar = lapSq / count - lapMean * lapMean;

  // Framing: how much detail sits in the central guide area vs the edges
  let centerEnergy = 0;
  let edgeEnergy = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const d = Math.abs(gray[i]! - mean);
      const inCenter = x > size * 0.2 && x < size * 0.8 && y > size * 0.25 && y < size * 0.75;
      if (inCenter) centerEnergy += d;
      else edgeEnergy += d;
    }
  }
  const framingRatio = centerEnergy / (centerEnergy + edgeEnergy || 1);

  const brightness = Math.round(Math.max(0, 100 - Math.abs(mean - 135) * 1.15));
  const sharpness = Math.round(Math.min(100, (lapVar / 90) * 100));
  const framing = Math.round(Math.min(100, (framingRatio / 0.62) * 100));

  const issues: string[] = [];
  if (mean < 85) issues.push("Image is too dark — move into better light or use the flash.");
  if (mean > 205) issues.push("Image is overexposed — step away from direct light or glare.");
  if (sharpness < 45) issues.push("Image is blurry — hold steady and keep 15–20 cm distance.");
  if (framing < 45)
    issues.push("Eyelid is not filling the guide box — move closer and centre the inner eyelid.");

  const score = Math.round(brightness * 0.3 + sharpness * 0.45 + framing * 0.25);
  return { score, brightness, sharpness, framing, passed: issues.length === 0 && score >= 55, issues };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("bad image"));
    img.src = src;
  });
}
