export interface ParsedMlsUpload {
  rawText?: string;
  structured?: Record<string, unknown>;
}

const keyAliases: Record<string, string> = {
  address: "street",
  street_address: "street",
  list_price: "listing_price",
  asking_price: "listing_price",
  beds: "bedrooms",
  bed: "bedrooms",
  baths: "bathrooms",
  bath: "bathrooms",
  sq_ft: "square_feet",
  sqft: "square_feet",
  square_footage: "square_feet",
  finished_square_feet: "finished_sq_ft",
  year: "year_built",
  remarks: "public_remarks",
  description: "public_remarks",
  school: "school_district",
  schools: "school_district",
  taxes: "annual_taxes",
  tax: "annual_taxes",
  hoa: "hoa_fee",
  amenities: "features",
  postal: "postal_code",
  zip: "postal_code",
  zip_code: "postal_code",
};

const stringValueKeys = new Set(["postal_code", "mls_number"]);

export function parseMlsUploadText(fileName: string, text: string): ParsedMlsUpload {
  const extension = getExtension(fileName);
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("The MLS file is empty.");
  }

  if (extension === "json") {
    return { structured: parseJsonMls(trimmed) };
  }

  if (extension === "csv" || looksLikeCsv(trimmed)) {
    return {
      rawText: text,
      structured: parseCsvMls(trimmed),
    };
  }

  if (extension === "txt" || extension === "text" || extension === "") {
    return { rawText: text };
  }

  throw new Error("Unsupported MLS file type. Upload a CSV, JSON, or text export.");
}

export function parseJsonMls(text: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The MLS JSON file could not be parsed.");
  }

  const record = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!isRecord(record)) {
    throw new Error("The MLS JSON file must contain an object or an array of objects.");
  }

  return normalizeStructuredMls(record);
}

export function parseCsvMls(text: string): Record<string, unknown> {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map(parseCsvLine);

  if (rows.length < 2) {
    throw new Error("The MLS CSV file must include a header row and one listing row.");
  }

  const headers = rows[0];
  const values = rows[1];
  if (!headers?.length || !values?.length) {
    throw new Error("The MLS CSV file is missing listing data.");
  }

  const structured: Record<string, unknown> = {};
  headers.forEach((header, index) => {
    const key = normalizeMlsKey(header);
    const value = values[index];
    if (!key || value == null || value === "") return;
    structured[key] = coerceMlsValue(value, key);
  });

  return structured;
}

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && next === "\"" && inQuotes) {
      current += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeStructuredMls(input: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = normalizeMlsKey(key);
    if (!normalizedKey || value == null || value === "") continue;

    if (Array.isArray(value)) {
      normalized[normalizedKey] = value;
    } else if (typeof value === "object") {
      normalized[normalizedKey] = value;
    } else if (typeof value === "string") {
      normalized[normalizedKey] = coerceMlsValue(value, normalizedKey);
    } else {
      normalized[normalizedKey] = value;
    }
  }

  return normalized;
}

function normalizeMlsKey(key: string): string {
  const snakeKey = key
    .trim()
    .toLowerCase()
    .replace(/[#/]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return keyAliases[snakeKey] ?? snakeKey;
}

function coerceMlsValue(value: string, key: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (stringValueKeys.has(key)) {
    return trimmed;
  }

  if (trimmed.includes(";")) {
    return trimmed
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const numeric = Number(trimmed.replace(/[$,%\s]/g, "").replace(/,/g, ""));
  if (!Number.isNaN(numeric) && /[\d]/.test(trimmed) && !/[a-z]/i.test(trimmed.replace(/sq\.?\s*ft\.?/i, ""))) {
    return numeric;
  }

  return trimmed;
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes(",");
}

function getExtension(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName.toLowerCase());
  return match?.[1] ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
