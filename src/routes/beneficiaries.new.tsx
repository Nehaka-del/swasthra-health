import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addBeneficiary, uid } from "@/lib/store";

export const Route = createFileRoute("/beneficiaries/new")({
  head: () => ({
    meta: [
      { title: "Register a beneficiary — SWASTHRA" },
      {
        name: "description",
        content: "Add a woman to your register with age, village, pregnancy status and anaemia history.",
      },
      { property: "og:title", content: "Register a beneficiary — SWASTHRA" },
      {
        property: "og:description",
        content: "Add a woman to your register before screening.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewBeneficiary,
});

function NewBeneficiary() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    village: "",
    healthId: "",
    notes: "",
  });
  const [pregnant, setPregnant] = useState(false);
  const [trimester, setTrimester] = useState<"1" | "2" | "3">("1");
  const [priorAnemia, setPriorAnemia] = useState(false);

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const age = Number(form.age);
    if (!form.name.trim() || !age || age < 10 || age > 99) {
      toast.error("Enter a name and a valid age between 10 and 99.");
      return;
    }
    const record = addBeneficiary({
      name: form.name.trim(),
      age,
      phone: form.phone.trim(),
      village: form.village.trim() || "Unspecified",
      healthId: form.healthId.trim() || `LOCAL-${uid("id").slice(-5).toUpperCase()}`,
      pregnant,
      trimester: pregnant ? trimester : undefined,
      priorAnemia,
      notes: form.notes.trim(),
    });
    toast.success(`${record.name} registered`);
    navigate({ to: "/beneficiaries/$id", params: { id: record.id } });
  }

  return (
    <AppShell title="Register beneficiary">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" className="h-12" {...field("name")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age *</Label>
                <Input id="age" className="h-12" inputMode="numeric" {...field("age")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" className="h-12" inputMode="tel" {...field("phone")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="village">Village / area</Label>
                <Input id="village" className="h-12" {...field("village")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="healthId">Health ID</Label>
                <Input id="healthId" className="h-12" {...field("healthId")} />
              </div>
            </div>

            <div className="flex min-h-14 items-center justify-between rounded-xl border border-border px-4">
              <Label htmlFor="pregnant" className="text-base">
                Currently pregnant
              </Label>
              <Switch id="pregnant" checked={pregnant} onCheckedChange={setPregnant} />
            </div>

            {pregnant && (
              <div className="space-y-2">
                <Label>Trimester</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["1", "2", "3"] as const).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={trimester === t ? "default" : "outline"}
                      className="h-12"
                      onClick={() => setTrimester(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex min-h-14 items-center justify-between rounded-xl border border-border px-4">
              <Label htmlFor="prior" className="text-base">
                Diagnosed with anaemia before
              </Label>
              <Switch id="prior" checked={priorAnemia} onCheckedChange={setPriorAnemia} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...field("notes")} />
            </div>

            <Button type="submit" className="h-12 w-full text-base">
              Save beneficiary
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
