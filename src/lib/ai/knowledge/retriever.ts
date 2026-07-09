import type { ConversationIntent, PropertyTwinContext } from "@/types/database";

import type { RetrievedKnowledge } from "../types";

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function scoreMatch(query: string, target: string): number {
  const queryWords = normalizeText(query).split(/\s+/).filter((w) => w.length > 2);
  const targetNorm = normalizeText(target);
  if (!queryWords.length) return 0;

  let score = 0;
  for (const word of queryWords) {
    if (targetNorm.includes(word)) score += 1;
  }
  return score;
}

function filterByRelevance<T extends { name?: string; title?: string; system_type?: string; summary?: string | null }>(
  items: T[],
  query: string,
  labelKey: keyof T,
): T[] {
  const scored = items
    .map((item) => {
      const label = String(item[labelKey] ?? "");
      const extra = "summary" in item && item.summary ? ` ${item.summary}` : "";
      const text = `${label}${extra}`;
      return { item, score: scoreMatch(query, text) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored.map(({ item }) => item) : items.slice(0, 5);
}

export function retrieveKnowledge(
  context: PropertyTwinContext,
  question: string,
  intent: ConversationIntent,
): RetrievedKnowledge {
  const query = question;

  let knowledgeObjects = context.knowledgeObjects;
  let systems = context.systems;
  let appliances = context.appliances;
  const documents = context.documents;
  let relevantPois = context.pointsOfInterest;

  if (context.currentPoi) {
    relevantPois = [
      context.currentPoi,
      ...context.pointsOfInterest.filter((p) => p.id !== context.currentPoi?.id),
    ];
  }

  if (intent === "mechanical_system" || intent === "maintenance" || intent === "utilities") {
    systems = filterByRelevance(systems, query, "system_type");
    knowledgeObjects = filterByRelevance(knowledgeObjects, query, "name");
  } else if (intent === "room_question") {
    relevantPois = filterByRelevance(relevantPois, query, "title");
    knowledgeObjects = filterByRelevance(knowledgeObjects, query, "name");
  } else if (intent === "property_question" || intent === "feature_comparison") {
    knowledgeObjects = filterByRelevance(knowledgeObjects, query, "name");
  } else if (intent === "schools" || intent === "neighborhood") {
    knowledgeObjects = knowledgeObjects.filter(
      (ko) => ko.category === "schools" || ko.category === "neighborhood",
    );
  } else {
    knowledgeObjects = filterByRelevance(knowledgeObjects, query, "name");
    appliances = filterByRelevance(appliances, query, "name");
  }

  const hasVerifiedData =
    knowledgeObjects.some((ko) => ko.verified_facts.length > 0) ||
    systems.length > 0 ||
    appliances.length > 0 ||
    documents.some((d) => d.searchable_content != null) ||
    context.property.public_remarks != null;

  return {
    knowledgeObjects,
    systems,
    appliances,
    features: context.features,
    documents,
    relevantPois,
    hasVerifiedData,
  };
}

export function formatKnowledgeForPrompt(knowledge: RetrievedKnowledge): string {
  const sections: string[] = [];

  if (knowledge.knowledgeObjects.length) {
    const koText = knowledge.knowledgeObjects
      .map((ko) => {
        const facts = ko.verified_facts
          .map((f) => `  - ${f.key}: ${f.value}`)
          .join("\n");
        const unknowns =
          ko.unknown_facts.length > 0
            ? `  Unknown: ${ko.unknown_facts.join(", ")}`
            : "";
        return `### ${ko.name} (${ko.category})\n${ko.summary ?? ""}\nVerified Facts:\n${facts || "  (none)"}\n${unknowns}`;
      })
      .join("\n\n");
    sections.push(`## Knowledge Objects\n${koText}`);
  }

  if (knowledge.systems.length) {
    const sysText = knowledge.systems
      .map(
        (s) =>
          `- ${s.system_type}: ${s.manufacturer ?? "unknown manufacturer"}, age ${s.age_years ?? "unknown"} years. ${s.notes ?? ""}`,
      )
      .join("\n");
    sections.push(`## Systems\n${sysText}`);
  }

  if (knowledge.appliances.length) {
    const appText = knowledge.appliances
      .map(
        (a) =>
          `- ${a.name}: ${a.manufacturer ?? ""} ${a.model ?? ""}. ${a.condition_notes ?? ""}`,
      )
      .join("\n");
    sections.push(`## Appliances\n${appText}`);
  }

  if (knowledge.features.length) {
    sections.push(
      `## Features\n${knowledge.features.map((f) => `- ${f.name}`).join("\n")}`,
    );
  }

  if (knowledge.documents.length) {
    const docText = knowledge.documents
      .filter((d) => d.searchable_content)
      .map((d) => `- ${d.title}: ${d.searchable_content?.slice(0, 300)}`)
      .join("\n");
    if (docText) sections.push(`## Documents\n${docText}`);
  }

  return sections.join("\n\n") || "No verified property knowledge available.";
}
