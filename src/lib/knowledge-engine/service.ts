import { createPropertyTwinService } from "@/lib/property-twin/service";
import type {
  CreateKnowledgeFactInput,
  CreateKnowledgeObjectInput,
  KnowledgeFact,
} from "@/lib/property-twin/types";
import type { ConversationIntent, PropertyTwinContext } from "@/types/database";

import { generateFaqsFromKnowledge } from "./faq";
import { calculateKnowledgeHealth } from "./health";
import { buildAiKnowledgeBundle } from "./retrieval";
import { autocompleteKnowledge, searchKnowledge } from "./search";
import type {
  AiKnowledgeBundle,
  KnowledgeHealthScore,
  KnowledgeSearchResult,
  KnowledgeSuggestion,
  PropertyFaq,
} from "./types";
import {
  detectConflictingFacts,
  detectDuplicateFacts,
  validateFactAgainstProperty,
  validateFactValue,
} from "./validation";

/**
 * Knowledge Engine — dedicated service for property memory (PRD-011).
 * All retrieval goes through the repository layer; facts are immutable and versioned.
 */
export class KnowledgeEngineService {
  private readonly twinPromise: ReturnType<typeof createPropertyTwinService>;

  private constructor(twinPromise: ReturnType<typeof createPropertyTwinService>) {
    this.twinPromise = twinPromise;
  }

  static async create(): Promise<KnowledgeEngineService> {
    return new KnowledgeEngineService(createPropertyTwinService());
  }

  private async getTwin() {
    return this.twinPromise;
  }

  async search(propertyId: string, query: string, limit = 20): Promise<KnowledgeSearchResult[]> {
    const twin = await this.getTwin();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    if (!snapshot) return [];

    const documents = snapshot.documents.map((d) => ({
      id: d.id,
      title: d.title,
      searchable_content: null as string | null,
    }));

    return searchKnowledge(
      query,
      snapshot.knowledgeObjects,
      snapshot.facts,
      snapshot.timeline,
      documents,
      limit,
    );
  }

  async autocomplete(propertyId: string, query: string): Promise<string[]> {
    const twin = await this.getTwin();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    return autocompleteKnowledge(query, snapshot?.knowledgeObjects ?? []);
  }

  async getHealth(propertyId: string): Promise<KnowledgeHealthScore | null> {
    const twin = await this.getTwin();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    if (!snapshot) return null;

    return calculateKnowledgeHealth({
      objects: snapshot.knowledgeObjects,
      facts: snapshot.facts,
      relationships: snapshot.relationships,
      documentCount: snapshot.documents.length,
      photoCount: snapshot.photos.length,
      timelineCount: snapshot.timeline.length,
    });
  }

  async getFaqs(propertyId: string): Promise<PropertyFaq[]> {
    const twin = await this.getTwin();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    if (!snapshot) return [];
    return generateFaqsFromKnowledge(propertyId, snapshot.knowledgeObjects, snapshot.facts);
  }

  async getSuggestions(propertyId: string): Promise<KnowledgeSuggestion[]> {
    const twin = await this.getTwin();
    const snapshot = await twin.getTwinSnapshot(propertyId);
    if (!snapshot) return [];

    const suggestions: KnowledgeSuggestion[] = [];
    const duplicates = detectDuplicateFacts(snapshot.facts);
    const conflicts = detectConflictingFacts(snapshot.facts);

    for (const group of duplicates) {
      suggestions.push({
        type: "duplicate_fact",
        message: `Duplicate fact detected: ${group[0]?.factKey}`,
        priority: 70,
        metadata: { factKey: group[0]?.factKey },
      });
    }

    for (const conflict of conflicts) {
      suggestions.push({
        type: "conflicting_fact",
        message: `Conflicting values for ${conflict.factKey}`,
        priority: 90,
        metadata: { values: conflict.values },
      });
    }

    const health = calculateKnowledgeHealth({
      objects: snapshot.knowledgeObjects,
      facts: snapshot.facts,
      relationships: snapshot.relationships,
      documentCount: snapshot.documents.length,
      photoCount: snapshot.photos.length,
      timelineCount: snapshot.timeline.length,
    });

    for (const item of health.missingItems) {
      suggestions.push({
        type: "missing_fact",
        message: item,
        priority: 60,
        metadata: {},
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  async validateFact(propertyId: string, factKey: string, factValue: string) {
    const twin = await this.getTwin();
    const profile = await twin.getProperty(propertyId);
    if (!profile) {
      return validateFactValue(factKey, factValue);
    }
    return validateFactAgainstProperty(profile, factKey, factValue, profile.publishedAt);
  }

  async addFact(input: CreateKnowledgeFactInput, actorId?: string | null): Promise<KnowledgeFact> {
    const validation = await this.validateFact(input.propertyId, input.factKey, input.factValue);
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }
    const twin = await this.getTwin();
    return twin.addFact(input, actorId);
  }

  async createObject(input: CreateKnowledgeObjectInput, actorId?: string | null) {
    const twin = await this.getTwin();
    return twin.createKnowledgeObject(input, actorId);
  }

  async getGraph(propertyId: string, rootObjectId?: string) {
    const twin = await this.getTwin();
    return twin.knowledgeGraph.queryGraph(propertyId, {
      rootObjectId,
      maxDepth: 3,
    });
  }

  async retrieveForAi(
    context: PropertyTwinContext,
    question: string,
    intent: ConversationIntent,
  ): Promise<AiKnowledgeBundle> {
    return buildAiKnowledgeBundle(context, question, intent);
  }

  async getFactHistory(knowledgeObjectId: string, factKey: string) {
    const twin = await this.getTwin();
    return twin.getFactHistory(knowledgeObjectId, factKey);
  }
}

export async function createKnowledgeEngineService(): Promise<KnowledgeEngineService> {
  return KnowledgeEngineService.create();
}
