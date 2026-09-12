import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CameraIcon,
  ClipboardList,
  Droplet,
  ScanEye,
  Send,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import { Disclaimer } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SWASTHRA — Smartphone Anaemia Screening for Health Workers" },
      {
        name: "description",
        content:
          "SWASTHRA helps community health workers run non-invasive, smartphone-based anaemia risk screening for women, with referrals and follow-up tracking.",
      },
      { property: "og:title", content: "SWASTHRA — Smartphone Anaemia Screening" },
      {
        property: "og:description",
        content:
          "Non-invasive anaemia risk screening for community health workers: guided capture, preliminary risk, referrals and follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    Icon: Users,
    title: "Register the beneficiary",
    body: "Capture age, village, pregnancy status and anaemia history once — reuse it at every visit.",
  },
  {
    Icon: ClipboardList,
    title: "Ask the health questions",
    body: "A short guided questionnaire on symptoms, diet, bleeding and supplements.",
  },
  {
    Icon: CameraIcon,
    title: "Capture the inner eyelid",
    body: "An on-screen guide frames the conjunctiva. Poor photos are rejected instantly with retake tips.",
  },
  {
    Icon: Activity,
    title: "Get a preliminary risk band",
    body: "Low, moderate or high, with the reasons, a suggested action, and one-tap referral or follow-up.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Droplet className="size-5" aria-hidden />
        </span>
        <span className="font-display text-lg font-bold">SWASTHRA</span>
        <Button asChild className="ml-auto touch-target px-5">
          <Link to="/sign-in">Open the app</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <ScanEye className="size-3.5" aria-hidden /> SIH 2026 prototype
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Smart women&apos;s health screening, from a phone in the field.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          SWASTHRA lets a community health worker screen a woman for anaemia risk in under two
          minutes — no needle, no lab, no internet dependency for the workflow. Capture, assess,
          refer, and follow up in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="touch-target px-6 text-base">
            <Link to="/sign-in">Start screening</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="touch-target px-6 text-base">
            <Link to="/sign-in" search={{ demo: true }}>
              Try the demo account
            </Link>
          </Button>
        </div>
        <Disclaimer className="mt-8 max-w-2xl" />
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-2">
          {STEPS.map(({ Icon, title, body }, i) => (
            <Card key={title} className="border-border">
              <CardContent className="flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">
                    {i + 1}. {title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3">
        <div>
          <Smartphone className="size-6 text-clay" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Built for the field</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Large touch targets, single-column forms, high contrast for daylight, and a workflow
            that survives interruptions.
          </p>
        </div>
        <div>
          <ShieldCheck className="size-6 text-clay" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Screening, not diagnosis</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every result is a preliminary risk band with an explicit instruction to confirm through
            a laboratory haemoglobin test.
          </p>
        </div>
        <div>
          <Send className="size-6 text-clay" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Closes the loop</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Referrals, follow-up reminders and a searchable history keep high-risk women from
            falling through the gaps.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        SWASTHRA · Smart Women&apos;s Health Screening &amp; Risk Assessment · Prototype
      </footer>
    </div>
  );
}
