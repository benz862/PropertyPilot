"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

import { WizardStepper } from "@/components/property/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { wizardSteps } from "@/lib/navigation/routes";

const STORAGE_KEY = "propertypilot-wizard-draft";

interface WizardDraft {
  step: number;
  street: string;
  city: string;
  provinceState: string;
  postalCode: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  listingPrice: string;
  publicRemarks: string;
}

const defaultDraft: WizardDraft = {
  step: 0,
  street: "",
  city: "",
  provinceState: "",
  postalCode: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  listingPrice: "",
  publicRemarks: "",
};

function getStoredDraft(): WizardDraft {
  if (typeof window === "undefined") {
    return defaultDraft;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultDraft;
  }

  try {
    return { ...defaultDraft, ...(JSON.parse(stored) as Partial<WizardDraft>) };
  } catch {
    return defaultDraft;
  }
}

export function PropertyWizard() {
  const router = useRouter();
  const [draft, setDraft] = useState<WizardDraft>(getStoredDraft);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const saveDraft = useCallback((next: WizardDraft) => {
    setDraft(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedAt(new Date().toLocaleTimeString());
  }, []);

  function updateField<K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) {
    saveDraft({ ...draft, [key]: value });
  }

  function goNext() {
    if (draft.step < wizardSteps.length - 1) {
      saveDraft({ ...draft, step: draft.step + 1 });
    } else {
      localStorage.removeItem(STORAGE_KEY);
      router.push("/dashboard");
    }
  }

  function goBack() {
    if (draft.step > 0) {
      saveDraft({ ...draft, step: draft.step - 1 });
    }
  }

  const currentStep = wizardSteps[draft.step];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <WizardStepper currentStep={draft.step} />

      {savedAt && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="size-3.5" aria-hidden />
          Auto-saved at {savedAt}
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{currentStep?.label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{currentStep?.description}</p>

        <div className="mt-6">
          {currentStep?.id === "basic-info" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={draft.street}
                  onChange={(e) => updateField("street", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={draft.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provinceState">State / Province</Label>
                  <Input
                    id="provinceState"
                    value={draft.provinceState}
                    onChange={(e) => updateField("provinceState", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={draft.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={draft.propertyType}
                    onValueChange={(value) => updateField("propertyType", value)}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={draft.bedrooms}
                    onChange={(e) => updateField("bedrooms", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={draft.bathrooms}
                    onChange={(e) => updateField("bathrooms", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="squareFeet">Sq Ft</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    value={draft.squareFeet}
                    onChange={(e) => updateField("squareFeet", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listingPrice">Listing Price</Label>
                <Input
                  id="listingPrice"
                  type="number"
                  value={draft.listingPrice}
                  onChange={(e) => updateField("listingPrice", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicRemarks">Public Remarks</Label>
                <Textarea
                  id="publicRemarks"
                  rows={4}
                  value={draft.publicRemarks}
                  onChange={(e) => updateField("publicRemarks", e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep?.id === "mls" && (
            <UploadPlaceholder
              title="Upload MLS Data"
              description="Drop your MLS export or PDF here. PropertyPilot will extract listing details automatically."
            />
          )}

          {currentStep?.id === "photos" && (
            <UploadPlaceholder
              title="Upload Photos"
              description="Add property photos. AI will detect rooms, features, and suggest knowledge objects."
            />
          )}

          {currentStep?.id === "documents" && (
            <UploadPlaceholder
              title="Upload Documents"
              description="Inspection reports, disclosures, floor plans, and warranties."
            />
          )}

          {currentStep?.id === "voice-notes" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-2xl" aria-hidden>
                  🎙
                </span>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Record voice notes about improvements, systems, and neighborhood
                details. Your knowledge trains the AI concierge.
              </p>
              <Button type="button" variant="outline">
                Start Recording
              </Button>
            </div>
          )}

          {currentStep?.id === "ai-build" && (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                PropertyPilot will analyze your uploads and build a complete digital
                property twin.
              </p>
              <Button type="button" variant="secondary">
                Build Property Twin
              </Button>
            </div>
          )}

          {currentStep?.id === "review" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Review AI-generated suggestions before publishing. Accept or dismiss
                each recommendation.
              </p>
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                AI suggestions will appear here after the build step.
              </div>
            </div>
          )}

          {currentStep?.id === "publish" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your property tour is ready. Publish to generate a QR code and share
                link.
              </p>
              <Button type="button" size="lg">
                Publish Property Tour
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={draft.step === 0}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button type="button" onClick={goNext}>
          {draft.step === wizardSteps.length - 1 ? "Finish" : "Continue"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">
          Save and exit
        </Link>
        {" — "}
        Return anytime to continue where you left off.
      </p>
    </div>
  );
}

function UploadPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button type="button" variant="outline" className="mt-2">
        Choose Files
      </Button>
    </div>
  );
}
