import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import logoAsset from "@/assets/swasthra-logo.jpeg.asset.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, startDemo } from "@/lib/store";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Health worker sign in — SWASTHRA" },
      {
        name: "description",
        content:
          "Sign in as a community health worker to run SWASTHRA anaemia screenings, or open the demo account with sample data.",
      },
      { property: "og:title", content: "Health worker sign in — SWASTHRA" },
      {
        property: "og:description",
        content: "Sign in or open the SWASTHRA demo account with sample beneficiaries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [area, setArea] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    signIn({ name: name.trim(), phone: phone.trim(), employeeId: employeeId.trim(), area: area.trim() });
    toast.success(`Welcome, ${name.split(" ")[0]}`);
    navigate({ to: "/dashboard" });
  }

  function demo() {
    startDemo();
    toast.success("Demo account loaded with sample beneficiaries");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6 flex items-center" aria-label="SWASTHRA home">
        <img
          src={logoAsset.url}
          alt="SWASTHRA — Innovation meets healthcare"
          className="h-16 w-auto object-contain"
        />
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Community health worker sign in</CardTitle>
          <CardDescription>
            Your screenings stay on this device. No password needed for the prototype.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={demo} variant="secondary" className="mb-5 h-12 w-full text-base">
            <Sparkles className="size-4" aria-hidden />
            Continue in demo mode
          </Button>

          <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or register yourself{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                className="h-12"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eid">Worker ID</Label>
              <Input
                id="eid"
                className="h-12"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Area / block</Label>
              <Input id="area" className="h-12" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <Button type="submit" className="h-12 w-full text-base">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
