import { CONCERN_PATTERNS } from "./config";
import type { BuyerConcernSignal } from "./types";

export function detectConcernsFromQuestions(questions: string[]): BuyerConcernSignal[] {
  const concernMap = new Map<string, { evidence: string[]; count: number }>();

  for (const question of questions) {
    for (const pattern of CONCERN_PATTERNS) {
      if (pattern.patterns.some((re) => re.test(question))) {
        const existing = concernMap.get(pattern.topic) ?? { evidence: [], count: 0 };
        existing.evidence.push(question);
        existing.count += 1;
        concernMap.set(pattern.topic, existing);
      }
    }
  }

  return Array.from(concernMap.entries()).map(([concern, data]) => ({
    concern: concern.charAt(0).toUpperCase() + concern.slice(1),
    confidence: Math.min(100, data.count * 25),
    evidence: data.evidence,
    frequency: data.count,
    resolved: false,
  }));
}

export function detectConcernsFromObjections(
  objections: Array<{ objection_topic: string; notes: string | null }>,
): BuyerConcernSignal[] {
  return objections.map((obj) => ({
    concern: obj.objection_topic,
    confidence: 70,
    evidence: obj.notes ? [obj.notes] : [],
    frequency: 1,
    resolved: false,
  }));
}
