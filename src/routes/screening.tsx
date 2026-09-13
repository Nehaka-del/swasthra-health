import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { assessImageQuality } from "@/lib/image-quality";
import { RISK_ACTION, RISK_LABEL, assessRisk } from "@/lib/risk";
import { modelMode, predictAnemia } from "@/lib/screening-service";
import { addFollowUp, addReferral, addScreening, useAppState } from "@/lib/store";
import type { Beneficiary, ImageQuality, Questionnaire, Screening } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/screening")({
  validateSearch: (s: Record<string, unknown>) => ({
    beneficiary: typeof s["beneficiary"] === "string" ? s["beneficiary"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Guided anaemia screening — SWASTHRA" },
      {
        name: "description",
        content:
          "Run a guided non-invasive anaemia screening: questionnaire, eyelid image capture, quality check and preliminary risk result.",
      },
      { property: "og:title", content: "Guided anaemia screening — SWASTHRA" },
      {
        property: "og:description",
        content: "Questionnaire, guided capture, quality check and preliminary risk result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreeningFlow,
});

const SYMPTOMS = [
  "Tiredness",
  "Dizziness",
  "Breathlessness",
  "Pale skin",
  "Headache",
  "Fast heartbeat",
  "Cold hands or feet",
  "Poor appetite",
];

const STEPS = ["Beneficiary", "Questions", "Capture", "Result"];

function ScreeningFlow() {
  const state = useAppState();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [step, setStep] = useState(0);
  const [beneficiaryId, setBeneficiaryId] = useState<string | undefined>(search.beneficiary);
  const [q, setQ] = useState<Questionnaire>({
    symptoms: [],
    dietIronRich: "sometimes",
    heavyMenstrualBleeding: false,
    recentIllness: false,
    supplementsTaken: false,
    fatigueLevel: 3,
  });
  const [image, setImage] = useState<string | null>(null);
  const [quality, setQuality] = useState<ImageQuality | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Screening | null>(null);

  const beneficiary = state.beneficiaries.find((b) => b.id === beneficiaryId);

  useEffect(() => {
    if (search.beneficiary && step === 0 && state.beneficiaries.some((b) => b.id === search.beneficiary)) {
      setBeneficiaryId(search.beneficiary);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.beneficiary, state.beneficiaries.length]);

  async function runScreening() {
    if (!beneficiary || !image || !quality?.passed) return;
    setProcessing(true);
    setProgress(8);
    const tick = setInterval(() => setProgress((p) => Math.min(92, p + 7)), 180);
    try {
      const prediction = await predictAnemia({
        imageDataUrl: image,
        beneficiary,
        questionnaire: q,
      });
      const outcome = assessRisk(beneficiary, q, prediction);
      const record = addScreening({
        beneficiaryId: beneficiary.id,
        chwId: state.chw?.id ?? "unknown",
        questionnaire: q,
        quality,
        prediction,
        risk: outcome.risk,
        riskScore: outcome.score,
        factors: outcome.factors,
        hbRangeLow: outcome.hbRangeLow,
        hbRangeHigh: outcome.hbRangeHigh,
      });
      setProgress(100);
      setResult(record);
      setStep(3);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "The screening service could not be reached.",
      );
    } finally {
      clearInterval(tick);
      setProcessing(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        {step > 0 && !result && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Back"
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">New screening</h1>
      </div>

      <ol className="mb-5 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="text-center">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "mt-1 block text-[11px] font-medium",
                i <= step ? "text-primary" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <SelectBeneficiary
          beneficiaries={state.beneficiaries}
          onSelect={(id) => {
            setBeneficiaryId(id);
            setStep(1);
          }}
        />
      )}

      {step === 1 && beneficiary && (
        <QuestionnaireStep
          beneficiary={beneficiary}
          value={q}
          onChange={setQ}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && beneficiary && (
        <CaptureStep
          image={image}
          quality={quality}
          processing={processing}
          progress={progress}
          onImage={async (dataUrl) => {
            setImage(dataUrl);
            setQuality(null);
            const assessed = await assessImageQuality(dataUrl);
            setQuality(assessed);
            if (!assessed.passed) toast.error("Image quality too low — please retake.");
          }}
          onReset={() => {
            setImage(null);
            setQuality(null);
          }}
          onRun={runScreening}
        />
      )}

      {step === 3 && result && beneficiary && (
        <ResultStep
          screening={result}
          beneficiary={beneficiary}
          onDone={() => navigate({ to: "/beneficiaries/$id", params: { id: beneficiary.id } })}
        />
      )}
    </AppShell>
  );
}

/* ------------------------------- step 1 ---------------------------------- */

function SelectBeneficiary({
  beneficiaries,
  onSelect,
}: {
  beneficiaries: Beneficiary[];
  onSelect: (id: string) => void;
}) {
  const [term, setTerm] = useState("");
  const list = useMemo(
    () =>
      beneficiaries.filter(
        (b) =>
          !term.trim() ||
          b.name.toLowerCase().includes(term.toLowerCase()) ||
          b.village.toLowerCase().includes(term.toLowerCase()),
      ),
    [beneficiaries, term],
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="find">Who are you screening?</Label>
          <Input
            id="find"
            className="h-12"
            placeholder="Search by name or village"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-border px-4 text-left transition-colors hover:border-primary/50"
              >
                <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-semibold text-primary">
                  {b.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{b.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {b.age} yrs · {b.village}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No match.{" "}
            <Link to="/beneficiaries/new" className="text-primary">
              Register a new beneficiary
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------- step 2 ---------------------------------- */

function QuestionnaireStep({
  beneficiary,
  value,
  onChange,
  onNext,
}: {
  beneficiary: Beneficiary;
  value: Questionnaire;
  onChange: (q: Questionnaire) => void;
  onNext: () => void;
}) {
  function toggleSymptom(s: string) {
    onChange({
      ...value,
      symptoms: value.symptoms.includes(s)
        ? value.symptoms.filter((x) => x !== s)
        : [...value.symptoms, s],
    });
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-5">
        <p className="text-sm text-muted-foreground">
          Health questions for <span className="font-medium text-foreground">{beneficiary.name}</span>
        </p>

        <div>
          <Label className="mb-2 block">Symptoms in the last 2 weeks</Label>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => {
              const on = value.symptoms.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  aria-pressed={on}
                  className={cn(
                    "min-h-14 rounded-xl border px-3 text-sm font-medium transition-colors",
                    on
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">How often are iron-rich foods eaten?</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["rarely", "sometimes", "often"] as const).map((d) => (
              <Button
                key={d}
                type="button"
                variant={value.dietIronRich === d ? "default" : "outline"}
                className="h-12 capitalize"
                onClick={() => onChange({ ...value, dietIronRich: d })}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Fatigue level: {value.fatigueLevel}/10</Label>
          <Slider
            value={[value.fatigueLevel]}
            min={0}
            max={10}
            step={1}
            onValueChange={([v]) => onChange({ ...value, fatigueLevel: v ?? 0 })}
          />
        </div>

        <Toggle
          id="bleeding"
          label="Heavy or prolonged menstrual bleeding"
          checked={value.heavyMenstrualBleeding}
          onChange={(v) => onChange({ ...value, heavyMenstrualBleeding: v })}
        />
        <Toggle
          id="illness"
          label="Illness or infection in the last month"
          checked={value.recentIllness}
          onChange={(v) => onChange({ ...value, recentIllness: v })}
        />
        <Toggle
          id="supplements"
          label="Currently taking iron / folic acid tablets"
          checked={value.supplementsTaken}
          onChange={(v) => onChange({ ...value, supplementsTaken: v })}
        />

        <Button className="h-12 w-full text-base" onClick={onNext}>
          Continue to image capture
        </Button>
      </CardContent>
    </Card>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border px-4">
      <Label htmlFor={id} className="text-base font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ------------------------------- step 3 ---------------------------------- */

function CaptureStep({
  image,
  quality,
  processing,
  progress,
  onImage,
  onReset,
  onRun,
}: {
  image: string | null;
  quality: ImageQuality | null;
  processing: boolean;
  progress: number;
  onImage: (dataUrl: string) => void;
  onReset: () => void;
  onRun: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError("Camera is not available here. Use 'Upload photo' instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function shoot() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      640,
      640,
    );
    stopCamera();
    onImage(canvas.toDataURL("image/jpeg", 0.7));
  }

  function upload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 640, 640);
        onImage(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  }

  if (processing) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Analysing the image</h2>
          <p className="text-sm text-muted-foreground">
            {progress < 40
              ? "Preparing image and metadata…"
              : progress < 75
                ? `Running the screening model (${modelMode === "api" ? "ML service" : "on-device simulation"})…`
                : "Combining with the health questionnaire…"}
          </p>
          <Progress value={progress} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold">Capture the lower inner eyelid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gently pull the lower eyelid down. Fill the guide box with the inner red surface, hold
              15–20 cm away, and use good daylight — no direct flash glare.
            </p>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
            {image ? (
              <img src={image} alt="Captured conjunctiva" className="size-full object-cover" />
            ) : cameraOn ? (
              <video ref={videoRef} playsInline muted className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-sm text-muted-foreground">
                Camera preview
              </div>
            )}
            {!image && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-[30%] w-[70%] rounded-full border-4 border-dashed border-primary/80" />
              </div>
            )}
          </div>

          {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {!image && !cameraOn && (
              <Button className="h-12" onClick={startCamera}>
                <Camera className="size-4" aria-hidden /> Open camera
              </Button>
            )}
            {cameraOn && (
              <Button className="h-12" onClick={shoot}>
                <Camera className="size-4" aria-hidden /> Capture photo
              </Button>
            )}
            {image ? (
              <Button variant="outline" className="h-12" onClick={onReset}>
                <RefreshCw className="size-4" aria-hidden /> Retake
              </Button>
            ) : (
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
                <Upload className="size-4" aria-hidden /> Upload photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {image && quality && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              {quality.passed ? (
                <CheckCircle2 className="size-5 text-risk-low" aria-hidden />
              ) : (
                <XCircle className="size-5 text-destructive" aria-hidden />
              )}
              <h2 className="text-base font-semibold">
                Image quality {quality.score}/100 —{" "}
                {quality.passed ? "accepted" : "not usable"}
              </h2>
            </div>
            <QualityBar label="Brightness" value={quality.brightness} />
            <QualityBar label="Sharpness" value={quality.sharpness} />
            <QualityBar label="Framing" value={quality.framing} />
            {quality.issues.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                {quality.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
            <Button
              className="h-12 w-full text-base"
              disabled={!quality.passed}
              onClick={onRun}
            >
              Run screening
            </Button>
          </CardContent>
        </Card>
      )}

      {image && !quality && (
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Checking image quality…
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-muted-foreground">{label}</span>
      <Progress value={value} className="flex-1" />
      <span className="w-10 text-right tabular-nums">{value}</span>
    </div>
  );
}

/* ------------------------------- step 4 ---------------------------------- */

function ResultStep({
  screening,
  beneficiary,
  onDone,
}: {
  screening: Screening;
  beneficiary: Beneficiary;
  onDone: () => void;
}) {
  const [facility, setFacility] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "priority" | "urgent">(
    screening.risk === "high" ? "urgent" : "routine",
  );
  const [referred, setReferred] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
  );
  const [scheduled, setScheduled] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <RiskBadge risk={screening.risk} size="lg" />
          <div>
            <h2 className="text-xl font-bold">{RISK_LABEL[screening.risk]}</h2>
            <p className="text-sm text-muted-foreground">
              {beneficiary.name} · {new Date(screening.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Estimated haemoglobin" value={`${screening.hbRangeLow}–${screening.hbRangeHigh} g/dL`} />
            <Metric label="Model confidence" value={`${Math.round(screening.prediction.confidence * 100)}%`} />
            <Metric label="Risk score" value={`${screening.riskScore}/100`} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Contributing factors</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {screening.factors.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-primary-soft p-4">
            <h3 className="text-sm font-semibold text-primary">Recommended action</h3>
            <p className="mt-1 text-sm">{RISK_ACTION[screening.risk]}</p>
          </div>
          <Disclaimer />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-base font-semibold">Create a referral</h2>
          {referred ? (
            <p className="text-sm text-risk-low">Referral created and added to tracking.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="facility">Facility</Label>
                <Input
                  id="facility"
                  className="h-12"
                  placeholder="e.g. Primary Health Centre"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["routine", "priority", "urgent"] as const).map((u) => (
                  <Button
                    key={u}
                    type="button"
                    variant={urgency === u ? "default" : "outline"}
                    className="h-12 capitalize"
                    onClick={() => setUrgency(u)}
                  >
                    {u}
                  </Button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rnotes">Notes</Label>
                <Textarea id="rnotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button
                className="h-12 w-full"
                onClick={() => {
                  if (!facility.trim()) {
                    toast.error("Enter the facility name.");
                    return;
                  }
                  addReferral({
                    beneficiaryId: beneficiary.id,
                    screeningId: screening.id,
                    facility: facility.trim(),
                    urgency,
                    notes: notes.trim(),
                  });
                  setReferred(true);
                  toast.success("Referral created");
                }}
              >
                Refer to facility
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-base font-semibold">Schedule a follow-up</h2>
          {scheduled ? (
            <p className="text-sm text-risk-low">Follow-up reminder added.</p>
          ) : (
            <>
              <Input
                type="date"
                className="h-12"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <Button
                variant="outline"
                className="h-12 w-full"
                onClick={() => {
                  addFollowUp({
                    beneficiaryId: beneficiary.id,
                    screeningId: screening.id,
                    dueDate: new Date(followUpDate).toISOString(),
                    reason:
                      screening.risk === "low"
                        ? "Routine re-screening"
                        : "Re-screen and review supplementation",
                  });
                  setScheduled(true);
                  toast.success("Follow-up scheduled");
                }}
              >
                Add reminder
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Button className="h-12 w-full text-base" onClick={onDone}>
        Finish and open profile
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
