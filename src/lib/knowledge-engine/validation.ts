import type { KnowledgeFact, PropertyProfile } from "@/lib/property-twin/types";

import type { FactValidationResult } from "./types";

const MEASUREMENT_PATTERN = /^\d+(\.\d+)?\s*(ft|in|m|cm|sq\s*ft|sqft|acres?)$/i;
const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export function validateFactValue(factKey: string, factValue: string): FactValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const key = factKey.toLowerCase();

  if (!factValue.trim()) {
    errors.push("Fact value cannot be empty.");
  }

  if (key.includes("measurement") || key.includes("size") || key.includes("dimension")) {
    if (!MEASUREMENT_PATTERN.test(factValue.trim())) {
      warnings.push("Measurements should include units (e.g., 1200 sq ft).");
    }
  }

  if (key.includes("year") || key.includes("date") || key.includes("installed")) {
    if (!DATE_PATTERN.test(factValue.trim()) && !/^\d{4}$/.test(factValue.trim())) {
      warnings.push("Dates should use YYYY or YYYY-MM-DD format.");
    }
  }

  if (key.includes("warranty") && key.includes("expiration")) {
    const yearMatch = factValue.match(/\d{4}/);
    if (yearMatch && Number(yearMatch[0]) < new Date().getFullYear()) {
      warnings.push("Warranty expiration appears to be in the past.");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateFactAgainstProperty(
  profile: PropertyProfile,
  factKey: string,
  factValue: string,
  listingDate?: string | null,
): FactValidationResult {
  const base = validateFactValue(factKey, factValue);
  const errors = [...base.errors];
  const warnings = [...base.warnings];
  const key = factKey.toLowerCase();

  const yearMatch = factValue.match(/\b(19|20)\d{2}\b/);
  const factYear = yearMatch ? Number(yearMatch[0]) : null;

  if (factYear && profile.yearBuilt && (key.includes("replacement") || key.includes("installed"))) {
    if (factYear < profile.yearBuilt) {
      errors.push(
        `${factKey} cannot occur before build year (${profile.yearBuilt}).`,
      );
    }
  }

  if (factYear && listingDate && key.includes("installation")) {
    const listingYear = new Date(listingDate).getFullYear();
    if (factYear > listingYear) {
      warnings.push(`${factKey} installation date is after listing date.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function detectDuplicateFacts(facts: KnowledgeFact[]): KnowledgeFact[][] {
  const groups = new Map<string, KnowledgeFact[]>();

  for (const fact of facts) {
    const key = `${fact.knowledgeObjectId}:${fact.factKey.toLowerCase()}`;
    const existing = groups.get(key) ?? [];
    existing.push(fact);
    groups.set(key, existing);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

export function detectConflictingFacts(facts: KnowledgeFact[]): Array<{
  factKey: string;
  values: string[];
}> {
  const byKey = new Map<string, Set<string>>();

  for (const fact of facts) {
    if (fact.verificationLevel === "retired") continue;
    const key = `${fact.knowledgeObjectId}:${fact.factKey}`;
    const values = byKey.get(key) ?? new Set();
    values.add(fact.factValue.toLowerCase().trim());
    byKey.set(key, values);
  }

  const conflicts: Array<{ factKey: string; values: string[] }> = [];
  for (const [key, values] of byKey) {
    if (values.size > 1) {
      conflicts.push({ factKey: key, values: [...values] });
    }
  }
  return conflicts;
}
