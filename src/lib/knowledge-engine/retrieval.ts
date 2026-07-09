import type { ConversationIntent } from "@/types/database";
import type { PropertyTwinContext } from "@/types/database";

import type { AiKnowledgeBundle } from "./types";
import { VERIFICATION_PRIORITY } from "@/lib/property-twin/constants";

function scoreMatch(query: string, target: string): number {
  const queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const targetNorm = target.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (targetNorm.includes(word)) score += 1;
  }
  return score;
}

export function buildAiKnowledgeBundle(
  context: PropertyTwinContext,
  question: string,
  intent: ConversationIntent,
): AiKnowledgeBundle {
  let objects = context.knowledgeObjects;

  if (intent === "mechanical_system" || intent === "maintenance" || intent === "utilities") {
    objects = objects.filter(
      (ko) =>
        ["mechanical", "hvac", "electrical", "plumbing", "utilities", "structural"].includes(
          ko.category ?? "",
        ) || scoreMatch(question, ko.name) > 0,
    );
  } else if (intent === "schools" || intent === "neighborhood") {
    objects = objects.filter((ko) =>
      ["schools", "neighborhood", "community"].includes(ko.category ?? ""),
    );
  } else {
    const scored = objects
      .map((ko) => ({
        ko,
        score: scoreMatch(question, `${ko.name} ${ko.summary ?? ""}`),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    objects = scored.length > 0 ? scored.map(({ ko }) => ko) : objects.slice(0, 8);
  }

  const policies: string[] = [];
  if (context.aiPolicy?.rules?.length) {
    policies.push(...context.aiPolicy.rules);
  }
  policies.push("Prefer verified facts over observed or pending facts.");
  policies.push("Never guess when knowledge is unavailable.");

  const bundleObjects = objects.map((ko) => ({
    id: ko.id,
    name: ko.name,
    category: ko.category,
    summary: ko.summary,
    facts: ko.verified_facts.map((f) => ({
      key: f.key,
      value: f.value,
      verificationLevel: "verified" as const,
      source: "manual_entry" as const,
    })),
  }));

  const hasVerifiedData =
    bundleObjects.some((o) => o.facts.length > 0) ||
    context.systems.length > 0 ||
    context.documents.some((d) => d.searchable_content != null);

  return { objects: bundleObjects, policies, hasVerifiedData };
}

export function formatAiKnowledgeBundle(bundle: AiKnowledgeBundle): string {
  const sections = bundle.objects.map((obj) => {
    const facts = obj.facts
      .sort(
        (a, b) =>
          VERIFICATION_PRIORITY.indexOf(a.verificationLevel) -
          VERIFICATION_PRIORITY.indexOf(b.verificationLevel),
      )
      .map((f) => `  - ${f.key}: ${f.value} (${f.verificationLevel})`)
      .join("\n");
    return `### ${obj.name}\n${obj.summary ?? ""}\n${facts || "  (no verified facts)"}`;
  });

  const policyText = bundle.policies.map((p) => `- ${p}`).join("\n");
  return `${sections.join("\n\n")}\n\n## Policies\n${policyText}`;
}
