import type { MlsExtractionResult } from "@/lib/property-builder/types";

const EXTRACTOR_VERSION = "1.0.0";

export interface MlsInput {
  rawText?: string;
  structured?: Record<string, unknown>;
}

export function extractMlsData(input: MlsInput): MlsExtractionResult {
  const structured = input.structured ?? {};
  const text = input.rawText ?? "";

  const fields: MlsExtractionResult["fields"] = {
    street: pickString(structured, ["street", "address", "street_address"]) ?? extractFromText(text, /(\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|blvd))/i),
    city: pickString(structured, ["city"]),
    provinceState: pickString(structured, ["state", "province", "province_state"]),
    postalCode: pickString(structured, ["postal_code", "zip", "zip_code"]),
    listingPrice: pickNumber(structured, ["listing_price", "price", "list_price"]),
    bedrooms: pickNumber(structured, ["bedrooms", "beds"]),
    bathrooms: pickNumber(structured, ["bathrooms", "baths"]),
    finishedSquareFeet: pickNumber(structured, ["finished_sq_ft", "square_feet", "sqft"]),
    lotSize: pickNumber(structured, ["lot_size", "lot_size_sq_ft"]),
    yearBuilt: pickNumber(structured, ["year_built", "year"]),
    propertyType: pickString(structured, ["property_type", "type"]),
    publicRemarks: pickString(structured, ["public_remarks", "remarks", "description"]) ?? extractRemarks(text),
    schoolDistrict: pickString(structured, ["school_district", "schools"]),
    annualTaxes: pickNumber(structured, ["annual_taxes", "taxes"]),
    hoaFee: pickNumber(structured, ["hoa_fee", "hoa"]),
    features: pickStringArray(structured, ["features", "amenities"]),
    rooms: pickStringArray(structured, ["rooms", "room_list"]),
    utilities: pickRecord(structured, ["utilities"]),
    taxInformation: pickRecord(structured, ["tax_information", "taxes_info"]),
  };

  return {
    source: "mls",
    version: EXTRACTOR_VERSION,
    extractedAt: new Date().toISOString(),
    fields,
    rawText: text || undefined,
  };
}

function pickString(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(data: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickStringArray(data: Record<string, unknown>, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    if (typeof value === "string" && value.includes(",")) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return undefined;
}

function pickRecord(
  data: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | undefined {
  for (const key of keys) {
    const value = data[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return undefined;
}

function extractFromText(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.trim();
}

function extractRemarks(text: string): string | undefined {
  const remarksMatch = text.match(/remarks?:\s*([\s\S]{20,500})/i);
  return remarksMatch?.[1]?.trim();
}
