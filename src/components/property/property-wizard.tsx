"use client";

import { type ChangeEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  Save,
  Upload,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
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
import { Progress } from "@/components/ui/progress";
import { wizardSteps } from "@/lib/navigation/routes";
import {
  parseMlsUploadText,
  type ParsedMlsUpload,
} from "@/lib/property-builder/mls-upload-parser";

const STORAGE_KEY = "propertypilot-wizard-draft";
const MAX_MLS_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_PHOTO_UPLOAD_COUNT = 75;
const MAX_DOCUMENT_UPLOAD_COUNT = 25;
const ROOM_OPTIONS = [
  "Kitchen",
  "Living Room",
  "Primary Bedroom",
  "Bathroom",
  "Basement",
  "Garage",
  "Backyard",
  "Exterior",
  "Neighborhood",
];

type UploadStatus = "idle" | "uploading" | "success" | "error";

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
  const [mlsFileName, setMlsFileName] = useState<string | null>(null);
  const [mlsPayload, setMlsPayload] = useState<ParsedMlsUpload | null>(null);
  const [mlsError, setMlsError] = useState<string | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "complete" | "error">("idle");
  const [buildMessage, setBuildMessage] = useState<string | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<UploadStatus>("idle");
  const [photoUploadMessage, setPhotoUploadMessage] = useState<string | null>(null);
  const [photoUploadCount, setPhotoUploadCount] = useState(0);
  const [documentUploadStatus, setDocumentUploadStatus] = useState<UploadStatus>("idle");
  const [documentUploadMessage, setDocumentUploadMessage] = useState<string | null>(null);
  const [documentUploadCount, setDocumentUploadCount] = useState(0);
  const [documentType, setDocumentType] = useState("other");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceNoteStatus, setVoiceNoteStatus] = useState<UploadStatus>("idle");
  const [voiceNoteMessage, setVoiceNoteMessage] = useState<string | null>(null);
  const [voiceNoteCount, setVoiceNoteCount] = useState(0);
  const [roomName, setRoomName] = useState("Kitchen");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomFeatures, setRoomFeatures] = useState("");
  const [roomUpdates, setRoomUpdates] = useState("");
  const [roomIncludedItems, setRoomIncludedItems] = useState("");
  const [roomTalkingPoints, setRoomTalkingPoints] = useState("");
  const [roomCautions, setRoomCautions] = useState("");
  const [roomSaveStatus, setRoomSaveStatus] = useState<UploadStatus>("idle");
  const [roomSaveMessage, setRoomSaveMessage] = useState<string | null>(null);
  const [roomSaveCount, setRoomSaveCount] = useState(0);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const saveDraft = useCallback((next: WizardDraft) => {
    setDraft(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedAt(new Date().toLocaleTimeString());
  }, []);

  function updateField<K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) {
    saveDraft({ ...draft, [key]: value });
  }

  async function handleMlsFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMlsError(null);

    if (!file) return;
    if (file.size > MAX_MLS_UPLOAD_BYTES) {
      setMlsPayload(null);
      setMlsFileName(null);
      setMlsError("MLS uploads must be 3 MB or smaller.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseMlsUploadText(file.name, text);
      setMlsPayload(parsed);
      setMlsFileName(file.name);
      saveDraft(applyMlsToDraft(draft, parsed));
    } catch (error) {
      setMlsPayload(null);
      setMlsFileName(null);
      setMlsError(error instanceof Error ? error.message : "Could not read the MLS file.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleBuildPropertyTwin() {
    setBuildStatus("building");
    setBuildMessage(null);

    try {
      const propertyId = await ensurePropertyCreated();

      const response = await fetch("/api/properties/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          mls: mlsPayload ?? undefined,
        }),
      });
      const body = (await response.json()) as { data?: unknown; error?: string | null };
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Property build failed.");
      }

      setBuildStatus("complete");
      setBuildMessage("Property twin built successfully. Continue to review suggestions.");
    } catch (error) {
      setBuildStatus("error");
      setBuildMessage(error instanceof Error ? error.message : "Property build failed.");
    }
  }

  async function ensurePropertyCreated(): Promise<string> {
    if (createdPropertyId) return createdPropertyId;

    const propertyId = await createPropertyFromDraft(draft);
    setCreatedPropertyId(propertyId);
    return propertyId;
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setPhotoUploadStatus("uploading");
    setPhotoUploadMessage(null);

    try {
      if (files.length > MAX_PHOTO_UPLOAD_COUNT) {
        throw new Error(`Upload ${MAX_PHOTO_UPLOAD_COUNT} photos or fewer at a time.`);
      }

      const propertyId = await ensurePropertyCreated();
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        data?: { photos?: unknown[] };
        error?: string | null;
      };

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Photo upload failed.");
      }

      const uploadedCount = body.data?.photos?.length ?? files.length;
      setPhotoUploadCount((count) => count + uploadedCount);
      setPhotoUploadStatus("success");
      setPhotoUploadMessage(`${uploadedCount} photo${uploadedCount === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setPhotoUploadStatus("error");
      setPhotoUploadMessage(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleDocumentUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setDocumentUploadStatus("uploading");
    setDocumentUploadMessage(null);

    try {
      if (files.length > MAX_DOCUMENT_UPLOAD_COUNT) {
        throw new Error(`Upload ${MAX_DOCUMENT_UPLOAD_COUNT} documents or fewer at a time.`);
      }

      const propertyId = await ensurePropertyCreated();
      const formData = new FormData();
      formData.append("documentType", documentType);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        data?: { documents?: unknown[] };
        error?: string | null;
      };

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Document upload failed.");
      }

      const uploadedCount = body.data?.documents?.length ?? files.length;
      setDocumentUploadCount((count) => count + uploadedCount);
      setDocumentUploadStatus("success");
      setDocumentUploadMessage(
        `${uploadedCount} document${uploadedCount === 1 ? "" : "s"} uploaded.`,
      );
    } catch (error) {
      setDocumentUploadStatus("error");
      setDocumentUploadMessage(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleVoiceNoteSave() {
    setVoiceNoteStatus("uploading");
    setVoiceNoteMessage(null);

    try {
      const transcript = voiceTranscript.trim();
      if (!transcript) {
        throw new Error("Enter a voice note transcript before saving.");
      }

      const propertyId = await ensurePropertyCreated();
      const response = await fetch(`/api/properties/${propertyId}/voice-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const body = (await response.json()) as { error?: string | null };

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Voice note capture failed.");
      }

      setVoiceNoteCount((count) => count + 1);
      setVoiceTranscript("");
      setVoiceNoteStatus("success");
      setVoiceNoteMessage("Voice note saved and converted into property knowledge.");
    } catch (error) {
      setVoiceNoteStatus("error");
      setVoiceNoteMessage(error instanceof Error ? error.message : "Voice note capture failed.");
    }
  }

  async function handleRoomKnowledgeSave() {
    setRoomSaveStatus("uploading");
    setRoomSaveMessage(null);

    try {
      const propertyId = await ensurePropertyCreated();
      const response = await fetch(`/api/properties/${propertyId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          description: roomDescription,
          features: splitLines(roomFeatures),
          updates: splitLines(roomUpdates),
          includedItems: splitLines(roomIncludedItems),
          talkingPoints: splitLines(roomTalkingPoints),
          cautions: splitLines(roomCautions),
        }),
      });
      const body = (await response.json()) as { error?: string | null };
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Room knowledge save failed.");
      }

      setRoomSaveStatus("success");
      setRoomSaveCount((count) => count + 1);
      setRoomSaveMessage(`${roomName} knowledge saved.`);
    } catch (error) {
      setRoomSaveStatus("error");
      setRoomSaveMessage(error instanceof Error ? error.message : "Room knowledge save failed.");
    }
  }

  async function handlePublish() {
    setPublishStatus("publishing");
    setPublishMessage(null);

    try {
      const propertyId = await ensurePropertyCreated();
      const response = await fetch(`/api/properties/${propertyId}/publish`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string | null };

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Publish failed.");
      }

      setPublishStatus("published");
      setPublishMessage("Property tour published successfully.");
    } catch (error) {
      setPublishStatus("error");
      setPublishMessage(error instanceof Error ? error.message : "Publish failed.");
    }
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
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="size-6" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Upload MLS Data</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Choose a CSV, JSON, or text MLS export. PropertyPilot will extract
                    listing details automatically.
                  </p>
                </div>
                <div>
                  <Input
                    id="mls-upload"
                    type="file"
                    accept=".csv,.json,.txt,text/csv,application/json,text/plain"
                    className="sr-only"
                    onChange={handleMlsFileChange}
                  />
                  <Button type="button" variant="outline" asChild>
                    <Label htmlFor="mls-upload" className="cursor-pointer">
                      <FileText className="size-4" aria-hidden />
                      Choose File
                    </Label>
                  </Button>
                </div>
              </div>

              {mlsFileName && mlsPayload && (
                <Alert variant="success" title="MLS file ready">
                  <p>{mlsFileName} was parsed and will be included in the property build.</p>
                </Alert>
              )}

              {mlsError && (
                <Alert variant="error" title="MLS upload failed">
                  <p>{mlsError}</p>
                </Alert>
              )}
            </div>
          )}

          {currentStep?.id === "photos" && (
            <BatchUploadPanel
              icon={<Camera className="size-6" aria-hidden />}
              title="Upload Photos"
              description="Select all property photos at once. Filenames like kitchen, garage, or backyard help room detection."
              inputId="photo-upload"
              accept="image/jpeg,image/png,image/webp"
              multiple
              buttonLabel="Choose Photos"
              onChange={handlePhotoUpload}
              status={photoUploadStatus}
              message={photoUploadMessage}
              uploadedCount={photoUploadCount}
            />
          )}

          {currentStep?.id === "documents" && (
            <div className="space-y-4">
              <div className="max-w-xs space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspection_report">Inspection Report</SelectItem>
                    <SelectItem value="property_disclosure">Property Disclosure</SelectItem>
                    <SelectItem value="floor_plan">Floor Plan</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="brochure">Brochure</SelectItem>
                    <SelectItem value="hoa_document">HOA Document</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="warranty">Warranty</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <BatchUploadPanel
                icon={<FileText className="size-6" aria-hidden />}
                title="Upload Documents"
                description="Upload PDFs, inspection images, floor plans, disclosures, warranties, and manuals."
                inputId="document-upload"
                accept="application/pdf,image/jpeg,image/png,text/plain"
                multiple
                buttonLabel="Choose Documents"
                onChange={handleDocumentUpload}
                status={documentUploadStatus}
                message={documentUploadMessage}
                uploadedCount={documentUploadCount}
              />
            </div>
          )}

          {currentStep?.id === "room-knowledge" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room</Label>
                  <Select value={roomName} onValueChange={setRoomName}>
                    <SelectTrigger id="roomName">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomDescription">Description</Label>
                  <Input
                    id="roomDescription"
                    value={roomDescription}
                    onChange={(event) => setRoomDescription(event.target.value)}
                    placeholder="Finished lower level, open kitchen, fenced backyard..."
                  />
                </div>
              </div>
              <RoomTextArea
                id="roomFeatures"
                label="Features"
                value={roomFeatures}
                onChange={setRoomFeatures}
                placeholder={"Granite countertops\nGas range\nCustom cabinetry"}
              />
              <RoomTextArea
                id="roomUpdates"
                label="Updates"
                value={roomUpdates}
                onChange={setRoomUpdates}
                placeholder={"Updated lighting in 2022\nNew dishwasher in 2023"}
              />
              <RoomTextArea
                id="roomIncludedItems"
                label="Included Items"
                value={roomIncludedItems}
                onChange={setRoomIncludedItems}
                placeholder={"Stainless refrigerator\nGas range\nDishwasher"}
              />
              <RoomTextArea
                id="roomTalkingPoints"
                label="Buyer Talking Points"
                value={roomTalkingPoints}
                onChange={setRoomTalkingPoints}
                placeholder={"Great prep space for entertaining\nStorage along west wall"}
              />
              <RoomTextArea
                id="roomCautions"
                label="Unknowns / Do Not Answer"
                value={roomCautions}
                onChange={setRoomCautions}
                placeholder="Buyer should verify fireplace use with inspection"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleRoomKnowledgeSave}
                disabled={roomSaveStatus === "uploading"}
              >
                {roomSaveStatus === "uploading" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                Save Room Knowledge
              </Button>
              {roomSaveMessage && (
                <Alert
                  variant={roomSaveStatus === "error" ? "error" : "success"}
                  title={roomSaveStatus === "error" ? "Room save failed" : "Room saved"}
                >
                  <p>{roomSaveMessage}</p>
                </Alert>
              )}
            </div>
          )}

          {currentStep?.id === "voice-notes" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mic className="size-6" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-foreground">Agent Knowledge Notes</p>
                  <p className="text-sm text-muted-foreground">
                    Paste or type what you would normally say into a voice memo.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceTranscript">Voice Note Transcript</Label>
                <Textarea
                  id="voiceTranscript"
                  rows={6}
                  value={voiceTranscript}
                  onChange={(event) => setVoiceTranscript(event.target.value)}
                  placeholder="Example: The roof was replaced in 2021, the kitchen has quartz counters, and buyers always ask about the school district..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleVoiceNoteSave}
                disabled={voiceNoteStatus === "uploading"}
              >
                {voiceNoteStatus === "uploading" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                Save Voice Note
              </Button>
              {voiceNoteMessage && (
                <Alert
                  variant={voiceNoteStatus === "error" ? "error" : "success"}
                  title={voiceNoteStatus === "error" ? "Voice note failed" : "Voice note saved"}
                >
                  <p>{voiceNoteMessage}</p>
                </Alert>
              )}
            </div>
          )}

          {currentStep?.id === "ai-build" && (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                PropertyPilot will analyze your uploads and build a complete digital
                property twin.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleBuildPropertyTwin}
                disabled={buildStatus === "building"}
              >
                {buildStatus === "building" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                Build Property Twin
              </Button>
              {buildMessage && (
                <Alert
                  variant={buildStatus === "error" ? "error" : "success"}
                  title={buildStatus === "error" ? "Build failed" : "Build complete"}
                  className="text-left"
                >
                  <p>{buildMessage}</p>
                </Alert>
              )}
            </div>
          )}

          {currentStep?.id === "review" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Review what has been captured before publishing.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewStat label="Property ID" value={createdPropertyId ?? "Not created yet"} />
                <ReviewStat label="MLS Upload" value={mlsFileName ?? "None"} />
                <ReviewStat label="Photos" value={String(photoUploadCount)} />
                <ReviewStat label="Documents" value={String(documentUploadCount)} />
                <ReviewStat label="Rooms" value={String(roomSaveCount)} />
                <ReviewStat label="Voice Notes" value={String(voiceNoteCount)} />
                <ReviewStat
                  label="Build"
                  value={buildStatus === "complete" ? "Complete" : "Not complete"}
                />
              </div>
            </div>
          )}

          {currentStep?.id === "publish" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your property tour is ready. Publish to generate a QR code and share
                link.
              </p>
              <Button
                type="button"
                size="lg"
                onClick={handlePublish}
                disabled={publishStatus === "publishing"}
              >
                {publishStatus === "publishing" && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                Publish Property Tour
              </Button>
              {publishMessage && (
                <Alert
                  variant={publishStatus === "published" ? "success" : "error"}
                  title={publishStatus === "published" ? "Published" : "Publishing blocked"}
                  className="text-left"
                >
                  <p>{publishMessage}</p>
                </Alert>
              )}
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
        {createdPropertyId ? "Open the property from the dashboard to continue editing." : "Return anytime to continue where you left off."}
      </p>
    </div>
  );
}

async function createPropertyFromDraft(draft: WizardDraft): Promise<string> {
  const requiredFields = [
    ["Street address", draft.street],
    ["City", draft.city],
    ["State / Province", draft.provinceState],
    ["Postal Code", draft.postalCode],
  ];
  const missing = requiredFields
    .filter(([, value]) => !String(value).trim())
    .map(([label]) => label);

  if (missing.length > 0) {
    throw new Error(`Complete these fields before building: ${missing.join(", ")}.`);
  }

  const response = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      street: draft.street,
      city: draft.city,
      provinceState: draft.provinceState,
      postalCode: draft.postalCode,
      propertyType: draft.propertyType,
      bedrooms: parseOptionalNumber(draft.bedrooms),
      bathrooms: parseOptionalNumber(draft.bathrooms),
      finishedSquareFeet: parseOptionalNumber(draft.squareFeet),
      listingPrice: parseOptionalNumber(draft.listingPrice),
      publicRemarks: draft.publicRemarks || null,
    }),
  });
  const body = (await response.json()) as { data?: { id?: string }; error?: string | null };
  if (!response.ok || body.error || !body.data?.id) {
    throw new Error(body.error ?? "Could not create the property.");
  }

  return body.data.id;
}

function applyMlsToDraft(draft: WizardDraft, payload: ParsedMlsUpload): WizardDraft {
  const structured = payload.structured;
  if (!structured) return draft;

  return {
    ...draft,
    street: getStructuredString(structured, "street") ?? draft.street,
    city: getStructuredString(structured, "city") ?? draft.city,
    provinceState: getStructuredString(structured, "state", "province", "province_state") ?? draft.provinceState,
    postalCode: getStructuredString(structured, "postal_code", "zip", "zip_code") ?? draft.postalCode,
    propertyType: getStructuredString(structured, "property_type", "type") ?? draft.propertyType,
    bedrooms: getStructuredNumberString(structured, "bedrooms", "beds") ?? draft.bedrooms,
    bathrooms: getStructuredNumberString(structured, "bathrooms", "baths") ?? draft.bathrooms,
    squareFeet:
      getStructuredNumberString(structured, "finished_sq_ft", "square_feet", "sqft") ??
      draft.squareFeet,
    listingPrice:
      getStructuredNumberString(structured, "listing_price", "price", "list_price") ??
      draft.listingPrice,
    publicRemarks:
      getStructuredString(structured, "public_remarks", "remarks", "description") ??
      draft.publicRemarks,
  };
}

function getStructuredString(
  structured: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = structured[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function getStructuredNumberString(
  structured: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = structured[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function BatchUploadPanel({
  icon,
  title,
  description,
  inputId,
  accept,
  multiple,
  buttonLabel,
  onChange,
  status,
  message,
  uploadedCount,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  inputId: string;
  accept: string;
  multiple?: boolean;
  buttonLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  status: UploadStatus;
  message: string | null;
  uploadedCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        <Input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={onChange}
        />
        <Button type="button" variant="outline" asChild disabled={status === "uploading"}>
          <Label htmlFor={inputId} className="cursor-pointer">
            {status === "uploading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-4" aria-hidden />
            )}
            {buttonLabel}
          </Label>
        </Button>
      </div>

      {status === "uploading" && <Progress value={50} />}

      {message && (
        <Alert
          variant={status === "error" ? "error" : "success"}
          title={status === "error" ? `${title} failed` : `${title} complete`}
        >
          <p>{message}</p>
        </Alert>
      )}

      {uploadedCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {uploadedCount} total uploaded in this wizard session.
        </p>
      )}
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function RoomTextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
