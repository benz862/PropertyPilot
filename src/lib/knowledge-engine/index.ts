export { KnowledgeEngineService, createKnowledgeEngineService } from "./service";
export { calculateKnowledgeHealth } from "./health";
export { searchKnowledge, autocompleteKnowledge } from "./search";
export { generateFaqsFromKnowledge } from "./faq";
export { buildAiKnowledgeBundle, formatAiKnowledgeBundle } from "./retrieval";
export {
  validateFactValue,
  validateFactAgainstProperty,
  detectDuplicateFacts,
  detectConflictingFacts,
} from "./validation";
export type {
  FactType,
  KnowledgeSearchResult,
  KnowledgeHealthScore,
  PropertyFaq,
  FactValidationResult,
  AiKnowledgeBundle,
  KnowledgeSuggestion,
} from "./types";
