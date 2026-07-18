import type { DocumentType } from "@/types/database";

export const PROPERTY_PHOTO_BUCKET = "property-photos";
export const PROPERTY_DOCUMENT_BUCKET = "documents";

export const MAX_PHOTO_FILES = 75;
export const MAX_DOCUMENT_FILES = 25;

export const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const ALLOWED_DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "text/plain"]);

const DOCUMENT_TYPES: DocumentType[] = [
  "inspection_report",
  "property_disclosure",
  "floor_plan",
  "survey",
  "brochure",
  "hoa_document",
  "receipt",
  "warranty",
  "manual",
  "other",
];

export function sanitizeStorageFileName(fileName: string): string {
  const safeName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "upload";
}

export function propertyUploadPath(propertyId: string, fileName: string): string {
  return `${propertyId}/${crypto.randomUUID()}-${sanitizeStorageFileName(fileName)}`;
}

export function inferRoomFromFileName(fileName: string): string | null {
  const normalized = fileName.toLowerCase().replace(/[_-]+/g, " ");
  const rooms = [
    "kitchen",
    "living room",
    "dining room",
    "primary bedroom",
    "bedroom",
    "bathroom",
    "garage",
    "backyard",
    "front yard",
    "patio",
    "deck",
    "basement",
    "laundry",
    "office",
  ];

  return rooms.find((room) => normalized.includes(room)) ?? null;
}

export function normalizeDocumentType(value: FormDataEntryValue | null): DocumentType {
  if (typeof value !== "string") return "other";
  return DOCUMENT_TYPES.includes(value as DocumentType) ? (value as DocumentType) : "other";
}

export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Uploaded file";
}
