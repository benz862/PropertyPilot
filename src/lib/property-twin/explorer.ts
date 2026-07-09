import type { PropertyTwinContext } from "@/types/database";

export interface PropertyTwinExplorerNode {
  id: string;
  label: string;
  type: "property" | "asset" | "knowledge" | "fact" | "document" | "photo" | "timeline";
  parentId: string | null;
  metadata: Record<string, unknown>;
}

export interface PropertyTwinExplorerModel {
  nodes: PropertyTwinExplorerNode[];
  searchIndex: Array<{ id: string; label: string; type: PropertyTwinExplorerNode["type"] }>;
  counts: {
    knowledgeObjects: number;
    facts: number;
    documents: number;
    photos: number;
    timeline: number;
    pointsOfInterest: number;
  };
}

export function buildPropertyTwinExplorerModel(
  context: PropertyTwinContext,
): PropertyTwinExplorerModel {
  const propertyId = context.property.id;
  const timeline = getOptionalTimeline(context);
  const nodes: PropertyTwinExplorerNode[] = [
    {
      id: propertyId,
      label: `${context.property.street}, ${context.property.city}`,
      type: "property",
      parentId: null,
      metadata: { status: context.property.status },
    },
  ];

  for (const poi of context.pointsOfInterest) {
    nodes.push({
      id: poi.id,
      label: poi.title,
      type: "asset",
      parentId: propertyId,
      metadata: { subtitle: poi.subtitle, estimatedMinutes: poi.estimated_viewing_minutes },
    });
  }

  for (const object of context.knowledgeObjects) {
    nodes.push({
      id: object.id,
      label: object.name,
      type: "knowledge",
      parentId: propertyId,
      metadata: { category: object.category, confidence: object.confidence_level },
    });

    for (const fact of object.verified_facts) {
      nodes.push({
        id: `${object.id}:${fact.key}`,
        label: `${fact.key}: ${fact.value}`,
        type: "fact",
        parentId: object.id,
        metadata: { key: fact.key, value: fact.value },
      });
    }
  }

  for (const document of context.documents) {
    nodes.push({
      id: document.id,
      label: document.title,
      type: "document",
      parentId: document.knowledge_object_id ?? propertyId,
      metadata: { documentType: document.document_type },
    });
  }

  for (const photo of context.photos) {
    nodes.push({
      id: photo.id,
      label: photo.caption ?? photo.detected_room ?? "Property photo",
      type: "photo",
      parentId: propertyId,
      metadata: { qualityScore: photo.quality_score, primary: photo.is_primary },
    });
  }

  for (const event of timeline) {
    nodes.push({
      id: event.id,
      label: event.title,
      type: "timeline",
      parentId: event.knowledge_object_id ?? propertyId,
      metadata: { eventType: event.event_type, eventDate: event.event_date },
    });
  }

  return {
    nodes,
    searchIndex: nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
    counts: {
      knowledgeObjects: context.knowledgeObjects.length,
      facts: context.knowledgeObjects.reduce(
        (sum, object) => sum + object.verified_facts.length,
        0,
      ),
      documents: context.documents.length,
      photos: context.photos.length,
      timeline: timeline.length,
      pointsOfInterest: context.pointsOfInterest.length,
    },
  };
}

function getOptionalTimeline(context: PropertyTwinContext) {
  if ("timeline" in context && Array.isArray(context.timeline)) {
    return context.timeline as Array<{
      id: string;
      title: string;
      description: string | null;
      event_type: string;
      event_date: string | null;
      knowledge_object_id: string | null;
    }>;
  }
  return [];
}
