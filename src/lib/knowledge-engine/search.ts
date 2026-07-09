import type { KnowledgeFact, KnowledgeObject, PropertyTimelineEvent } from "@/lib/property-twin/types";

import type { KnowledgeSearchResult } from "./types";

const SYNONYMS: Record<string, string[]> = {
  hvac: ["heating", "cooling", "furnace", "air conditioning", "ac"],
  roof: ["shingles", "roofing", "attic"],
  kitchen: ["cooktop", "countertops", "cabinet"],
  garage: ["workshop", "parking"],
  pool: ["swimming", "spa"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

function expandQuery(query: string): string[] {
  const words = normalize(query).split(/\s+/).filter((w) => w.length > 1);
  const expanded = new Set(words);

  for (const word of words) {
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      if (word === key || synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach((s) => expanded.add(s));
      }
    }
  }

  return [...expanded];
}

function fuzzyScore(queryTerms: string[], target: string): number {
  const normalized = normalize(target);
  if (!normalized) return 0;

  let score = 0;
  for (const term of queryTerms) {
    if (normalized.includes(term)) {
      score += term.length > 3 ? 2 : 1;
    } else if (term.length > 3) {
      for (let i = 0; i <= normalized.length - term.length; i++) {
        const slice = normalized.slice(i, i + term.length);
        let matches = 0;
        for (let j = 0; j < term.length; j++) {
          if (slice[j] === term[j]) matches++;
        }
        if (matches / term.length >= 0.75) {
          score += 0.5;
          break;
        }
      }
    }
  }
  return score;
}

export function searchKnowledge(
  query: string,
  objects: KnowledgeObject[],
  facts: KnowledgeFact[],
  timeline: PropertyTimelineEvent[],
  documents: Array<{ id: string; title: string; searchable_content: string | null }>,
  limit = 20,
): KnowledgeSearchResult[] {
  if (!query.trim()) return [];

  const queryTerms = expandQuery(query);
  const results: KnowledgeSearchResult[] = [];

  for (const object of objects) {
    const text = `${object.name} ${object.summary ?? ""} ${object.category}`;
    const score = fuzzyScore(queryTerms, text);
    if (score > 0) {
      results.push({
        type: "object",
        id: object.id,
        title: object.name,
        subtitle: object.category,
        score,
        category: object.category,
      });
    }
  }

  for (const fact of facts) {
    const text = `${fact.factKey} ${fact.factValue}`;
    const score = fuzzyScore(queryTerms, text);
    if (score > 0) {
      const object = objects.find((o) => o.id === fact.knowledgeObjectId);
      results.push({
        type: "fact",
        id: fact.id,
        title: `${fact.factKey}: ${fact.factValue}`,
        subtitle: object?.name ?? null,
        score,
      });
    }
  }

  for (const event of timeline) {
    const text = `${event.title} ${event.description ?? ""} ${event.eventType}`;
    const score = fuzzyScore(queryTerms, text);
    if (score > 0) {
      results.push({
        type: "timeline",
        id: event.id,
        title: event.title,
        subtitle: event.eventDate,
        score,
      });
    }
  }

  for (const doc of documents) {
    const text = `${doc.title} ${doc.searchable_content ?? ""}`;
    const score = fuzzyScore(queryTerms, text);
    if (score > 0) {
      results.push({
        type: "document",
        id: doc.id,
        title: doc.title,
        subtitle: "Document",
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function autocompleteKnowledge(
  query: string,
  objects: KnowledgeObject[],
  limit = 8,
): string[] {
  if (!query.trim()) return [];

  const normalized = normalize(query);
  const suggestions = new Set<string>();

  for (const object of objects) {
    if (normalize(object.name).startsWith(normalized)) {
      suggestions.add(object.name);
    }
    if (object.summary && normalize(object.summary).includes(normalized)) {
      suggestions.add(object.name);
    }
  }

  return [...suggestions].slice(0, limit);
}
