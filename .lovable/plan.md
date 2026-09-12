# SWASTHRA — Smart Women's Health Screening & Risk Assessment

A mobile-first prototype for community health workers (CHWs) to run smartphone-based,
non-invasive anemia screening, from beneficiary registration through referral and follow-up.

## Scope for this build

Everything runs as a complete, working demo using on-device storage (no backend account
needed to try it). The screening step calls a clearly separated "AI service" layer that
today returns a realistic simulated result and can be pointed at a real Python/FastAPI
model later by changing one setting.

## Screens

1. **Landing page** — what SWASTHRA does, how screening works in 4 steps, who it's for,
   and a prominent "non-diagnostic screening tool" disclaimer.
2. **Sign in** — CHW login/registration plus a one-tap **Demo mode** that loads a seeded
   worker account with sample beneficiaries and past screenings.
3. **Dashboard** — live counts: screenings today/this week, beneficiaries registered,
   risk breakdown (Low/Moderate/High), pending referrals, follow-ups due, plus quick
   actions and a recent-activity feed.
4. **Beneficiary directory** — searchable, filterable list; each profile shows details,
   screening timeline, risk trend, referrals and follow-ups.
5. **New beneficiary registration** — name, age, contact, village/area, ID, pregnancy
   status, prior anemia history.
6. **Screening flow** (guided, step-by-step with progress):
   - Health questionnaire (symptoms, diet, menstrual/pregnancy factors, fatigue, etc.)
   - Guided image capture — live camera with an on-screen alignment guide for the
     lower-eyelid conjunctiva, plus file upload fallback
   - Automatic image quality check — brightness, blur, exposure and framing scored on
     device; poor captures are rejected with specific retake guidance
   - Processing stage with progress states while the screening service runs
   - Result: preliminary risk band (Low / Moderate / High), estimated hemoglobin range,
     confidence, contributing factors, and a firm non-diagnostic disclaimer with
     recommended next actions
7. **Referrals** — create a referral from a result (facility, urgency, notes), track
   status (pending / completed / declined), searchable list.
8. **Follow-ups** — schedule a follow-up date from a result or profile, see due/overdue
   items on the dashboard and in a notification centre.
9. **Screening history** — searchable and filterable by date, risk level, village.
10. **Notifications** — in-app centre for follow-ups due, pending referrals, and
    unresolved high-risk cases.

## Risk assessment

Risk combines the image-based estimate with questionnaire factors (age, pregnancy,
symptom count, diet, history) into a weighted preliminary score, mapped to Low /
Moderate / High with the reasons shown to the CHW. Every result carries the
non-diagnostic disclaimer and a "confirm with lab test" recommendation.

## Design direction

Clinical and calm, not corporate-blue-generic: deep teal and warm clay accents, high
contrast for outdoor/daylight use, large touch targets (min 48px), bottom navigation on
phones, single-column forms, and clear colour+icon coding for risk bands (never colour
alone).

## Technical notes

- Data layer is a single typed store with local persistence and seeded demo data, so
  every screen reads and writes real state across the whole workflow.
- `src/lib/screening-service.ts` is the only place the model is called. It exposes a
  `predictAnemia(image, metadata)` contract matching a FastAPI endpoint
  (`POST /predict` → `{ hemoglobin_estimate, confidence, risk }`) with a mock adapter
  active by default and an HTTP adapter ready to enable.
- Image quality assessment runs in the browser on a canvas (luminance, variance-based
  blur, region framing) before any prediction is attempted.
- Separate routes with their own page titles and descriptions for landing, auth,
  dashboard, beneficiaries, screening, referrals, follow-ups, history and settings.

## Not included

Real ML inference, real SMS/push delivery, and cloud sync. Wiring the live model or
cloud accounts is a follow-up step once the prototype is approved.
