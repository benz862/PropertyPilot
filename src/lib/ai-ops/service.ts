import type {
  ConversationReview,
  ImprovementPriority,
  ImprovementStatus,
  KnowledgeGap,
  PropertyImprovementItem,
  QualityIssue,
} from "./types";

const reviewStore = new Map<string, ConversationReview>();
const gapStore = new Map<string, KnowledgeGap>();
const improvementStore = new Map<string, PropertyImprovementItem>();

/**
 * AI Operations Platform (PRD-018) — conversation analysis and improvement queue.
 */
export class AiOpsService {
  analyzeConversation(input: {
    conversationId: string;
    propertyId: string;
    transcript: Array<{ role: string; content: string }>;
    unknownCount?: number;
    escalationCount?: number;
    durationSeconds?: number;
  }): ConversationReview {
    const userMessages = input.transcript.filter((m) => m.role === "user");
    const assistantMessages = input.transcript.filter((m) => m.role === "assistant");
    const unknownAnswers =
      input.unknownCount ??
      assistantMessages.filter(
        (m) =>
          m.content.toLowerCase().includes("don't know") ||
          m.content.toLowerCase().includes("not sure") ||
          m.content.toLowerCase().includes("agent"),
      ).length;

    const review: ConversationReview = {
      id: crypto.randomUUID(),
      conversationId: input.conversationId,
      propertyId: input.propertyId,
      knowledgeCoverage: Math.max(0, 100 - unknownAnswers * 15),
      confidence: unknownAnswers === 0 ? 90 : Math.max(30, 90 - unknownAnswers * 20),
      unknownAnswers,
      escalations: input.escalationCount ?? 0,
      averageResponseMs: 800,
      conversationLength: input.transcript.length,
      followUpRequests: userMessages.filter((m) => m.content.includes("?")).length,
      analyzedAt: new Date().toISOString(),
    };

    reviewStore.set(review.id, review);

    for (const message of userMessages) {
      if (!message.content.includes("?")) continue;
      const isUnknown = assistantMessages.some(
        (a) =>
          a.content.toLowerCase().includes("don't know") ||
          a.content.toLowerCase().includes("verify"),
      );
      if (isUnknown) {
        this.createKnowledgeGap({
          propertyId: input.propertyId,
          question: message.content,
          priority: "important",
          reason: "Unanswered during conversation",
          suggestedSource: "Agent verification or document upload",
          suggestedAction: "Add verified fact to knowledge engine",
        });
      }
    }

    return review;
  }

  createKnowledgeGap(input: Omit<KnowledgeGap, "id" | "status" | "createdAt">): KnowledgeGap {
    const gap: KnowledgeGap = {
      id: crypto.randomUUID(),
      ...input,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    gapStore.set(gap.id, gap);

    this.addImprovementItem({
      propertyId: input.propertyId,
      title: `Answer: ${input.question.slice(0, 80)}`,
      priority: input.priority,
      source: "conversation",
    });

    return gap;
  }

  addImprovementItem(input: {
    propertyId: string;
    title: string;
    priority: ImprovementPriority;
    source: PropertyImprovementItem["source"];
  }): PropertyImprovementItem {
    const item: PropertyImprovementItem = {
      id: crypto.randomUUID(),
      propertyId: input.propertyId,
      title: input.title,
      priority: input.priority,
      status: "open",
      source: input.source,
      createdAt: new Date().toISOString(),
    };
    improvementStore.set(item.id, item);
    return item;
  }

  getImprovementQueue(propertyId: string, status?: ImprovementStatus): PropertyImprovementItem[] {
    return [...improvementStore.values()]
      .filter((i) => i.propertyId === propertyId && (!status || i.status === status))
      .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  }

  getKnowledgeGaps(propertyId: string): KnowledgeGap[] {
    return [...gapStore.values()].filter((g) => g.propertyId === propertyId);
  }

  runQualityChecks(propertyId: string, facts: Array<{ key: string; value: string }>): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const seen = new Map<string, string>();

    for (const fact of facts) {
      const existing = seen.get(fact.key);
      if (existing && existing !== fact.value) {
        issues.push({
          type: "contradictory_fact",
          message: `Conflicting values for ${fact.key}`,
          severity: "critical",
        });
      }
      seen.set(fact.key, fact.value);
    }

    return issues;
  }

  resolveImprovement(itemId: string): PropertyImprovementItem | null {
    const item = improvementStore.get(itemId);
    if (!item) return null;
    item.status = "resolved";
    improvementStore.set(itemId, item);
    return item;
  }
}

function priorityWeight(p: ImprovementPriority): number {
  switch (p) {
    case "critical":
      return 4;
    case "important":
      return 3;
    case "suggested":
      return 2;
    case "enhancement":
      return 1;
  }
}

export async function createAiOpsService(): Promise<AiOpsService> {
  return new AiOpsService();
}
