"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { buyerRoutes } from "@/lib/navigation/routes";

interface LeadCaptureFormProps {
  slug: string;
  propertyId: string;
  visitorSessionId?: string | null;
}

export function LeadCaptureForm({ slug, propertyId, visitorSessionId }: LeadCaptureFormProps) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      propertyId,
      visitorSessionId: visitorSessionId ?? undefined,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      timeline: formData.get("timeline") as string,
      intent: formData.get("intent") as string,
      workingWithRealtor: formData.get("workingWithRealtor") === "on",
      notes: formData.get("notes") as string,
      consent,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string | null };
      if (!response.ok) throw new Error(result.error ?? "We could not save your request.");
      router.push(buyerRoutes.thanks(slug));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not save your request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Receive the complete property guide, floor plan, and feature sheet by email.
        Your name is optional; we use your email only for this property request.
      </p>

      {error && <Alert variant="error" title="Please try again">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" autoComplete="given-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Timeline</Label>
        <Select name="timeline">
          <SelectTrigger id="timeline">
            <SelectValue placeholder="When are you looking to buy?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediately</SelectItem>
            <SelectItem value="1-3months">1–3 months</SelectItem>
            <SelectItem value="3-6months">3–6 months</SelectItem>
            <SelectItem value="6plus">6+ months</SelectItem>
            <SelectItem value="exploring">Just exploring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intent">I am</Label>
        <Select name="intent">
          <SelectTrigger id="intent">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buying">Buying</SelectItem>
            <SelectItem value="selling">Selling</SelectItem>
            <SelectItem value="investing">Investing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="workingWithRealtor" name="workingWithRealtor" />
        <Label htmlFor="workingWithRealtor" className="font-normal">
          Already working with a realtor
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Any questions or preferences?" />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
        <Switch
          id="consent"
          checked={consent}
          onCheckedChange={setConsent}
          aria-required
        />
        <Label htmlFor="consent" className="font-normal leading-relaxed">
          I agree to receive an email about this property from the listing agent.
        </Label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" className="min-h-12 flex-1" disabled={!consent || isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Me the Property Guide"}
        </Button>
        <Button type="button" variant="ghost" size="lg" asChild>
          <Link href={buyerRoutes.welcome(slug)}>Skip for now</Link>
        </Button>
      </div>
    </form>
  );
}
