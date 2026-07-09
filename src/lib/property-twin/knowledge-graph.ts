import { VERIFICATION_PRIORITY } from "@/lib/property-twin/constants";
import type { PropertyTwinRepository } from "@/lib/property-twin/repository";
import type {
  KnowledgeFact,
  KnowledgeGraphNode,
  KnowledgeObject,
  KnowledgeRelationship,
  VerificationLevel,
} from "@/lib/property-twin/types";

export interface KnowledgeGraphQueryOptions {
  rootObjectId?: string;
  maxDepth?: number;
  includeRetiredFacts?: boolean;
  preferredVerification?: VerificationLevel[];
}

export class KnowledgeGraphService {
  constructor(private readonly repository: PropertyTwinRepository) {}

  async queryGraph(
    propertyId: string,
    options: KnowledgeGraphQueryOptions = {},
  ): Promise<KnowledgeGraphNode[]> {
    const maxDepth = options.maxDepth ?? 3;
    const objects = await this.repository.listKnowledgeObjects(propertyId);
    const facts = await this.repository.listCurrentFacts(propertyId);
    const relationships = await this.repository.listRelationships(propertyId);

    const factsByObject = groupFactsByObject(facts, options.includeRetiredFacts ?? false);
    const adjacency = buildAdjacencyMap(relationships);

    if (options.rootObjectId) {
      const root = objects.find((object) => object.id === options.rootObjectId);
      if (!root) {
        return [];
      }

      return [
        buildNode(root, factsByObject, adjacency, objects, new Set(), 0, maxDepth),
      ];
    }

    return objects.map((object) =>
      buildNode(object, factsByObject, adjacency, objects, new Set(), 0, maxDepth),
    );
  }

  async findFactsByKey(propertyId: string, factKey: string): Promise<KnowledgeFact[]> {
    const facts = await this.repository.listCurrentFacts(propertyId);
    return facts
      .filter((fact) => fact.factKey === factKey)
      .sort((a, b) => compareVerification(a.verificationLevel, b.verificationLevel));
  }

  async getVerifiedFactsForAi(propertyId: string): Promise<KnowledgeFact[]> {
    const facts = await this.repository.listCurrentFacts(propertyId);
    return facts
      .filter((fact) => fact.verificationLevel === "verified" || fact.verificationLevel === "likely")
      .sort((a, b) => compareVerification(a.verificationLevel, b.verificationLevel));
  }

  async traverseFromObject(
    propertyId: string,
    objectId: string,
    maxDepth = 2,
  ): Promise<KnowledgeGraphNode | null> {
    const graph = await this.queryGraph(propertyId, { rootObjectId: objectId, maxDepth });
    return graph[0] ?? null;
  }
}

function groupFactsByObject(
  facts: KnowledgeFact[],
  includeRetired: boolean,
): Map<string, KnowledgeFact[]> {
  const map = new Map<string, KnowledgeFact[]>();

  for (const fact of facts) {
    if (!includeRetired && fact.verificationLevel === "retired") {
      continue;
    }

    const existing = map.get(fact.knowledgeObjectId) ?? [];
    existing.push(fact);
    map.set(fact.knowledgeObjectId, existing);
  }

  return map;
}

function buildAdjacencyMap(
  relationships: KnowledgeRelationship[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const relationship of relationships) {
    const sourceLinks = map.get(relationship.sourceObjectId) ?? [];
    sourceLinks.push(relationship.targetObjectId);
    map.set(relationship.sourceObjectId, sourceLinks);

    const targetLinks = map.get(relationship.targetObjectId) ?? [];
    targetLinks.push(relationship.sourceObjectId);
    map.set(relationship.targetObjectId, targetLinks);
  }

  return map;
}

function buildNode(
  object: KnowledgeObject,
  factsByObject: Map<string, KnowledgeFact[]>,
  adjacency: Map<string, string[]>,
  allObjects: KnowledgeObject[],
  visited: Set<string>,
  depth: number,
  maxDepth: number,
): KnowledgeGraphNode {
  visited.add(object.id);

  const relatedIds = adjacency.get(object.id) ?? [];
  const relatedObjects: KnowledgeGraphNode[] = [];

  if (depth < maxDepth) {
    for (const relatedId of relatedIds) {
      if (visited.has(relatedId)) {
        continue;
      }

      const relatedObject = allObjects.find((item) => item.id === relatedId);
      if (!relatedObject) {
        continue;
      }

      relatedObjects.push(
        buildNode(
          relatedObject,
          factsByObject,
          adjacency,
          allObjects,
          visited,
          depth + 1,
          maxDepth,
        ),
      );
    }
  }

  return {
    object,
    facts: factsByObject.get(object.id) ?? [],
    relatedObjects,
  };
}

function compareVerification(a: VerificationLevel, b: VerificationLevel): number {
  return VERIFICATION_PRIORITY.indexOf(a) - VERIFICATION_PRIORITY.indexOf(b);
}
