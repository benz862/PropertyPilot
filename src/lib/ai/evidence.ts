import type { PropertyTwinContext } from "@/types/database";

export interface AiEvidenceItem {
  type: "knowledge_object" | "document" | "photo" | "timeline";
  title: string;
  detail: string | null;
  source: string;
}

export function buildEvidenceItems(
  context: PropertyTwinContext,
  knowledgeObjectIds: string[],
): AiEvidenceItem[] {
  const evidence: AiEvidenceItem[] = [];
  const selectedObjects = context.knowledgeObjects.filter((object) =>
    knowledgeObjectIds.includes(object.id),
  );

  for (const object of selectedObjects) {
    evidence.push({
      type: "knowledge_object",
      title: object.name,
      detail: object.summary,
      source: object.verification_source ?? "Digital Property Twin",
    });
  }

  for (const document of context.documents.slice(0, 3)) {
    evidence.push({
      type: "document",
      title: document.title,
      detail: document.searchable_content?.slice(0, 140) ?? null,
      source: "Property document",
    });
  }

  const timeline = getOptionalTimeline(context);
  for (const event of timeline.slice(0, 3)) {
    evidence.push({
      type: "timeline",
      title: event.title,
      detail: event.description,
      source: event.verification_level,
    });
  }

  return evidence.slice(0, 5);
}

function getOptionalTimeline(context: PropertyTwinContext) {
  if ("timeline" in context && Array.isArray(context.timeline)) {
    return context.timeline as Array<{
      title: string;
      description: string | null;
      verification_level: string;
    }>;
  }
  return [];
}
