export const INTEREST_SCORE_WEIGHTS: Record<string, number> = {
  workshop: 4,
  pool: 3,
  schools: 2,
  garage: 5,
  accessibility: 6,
  office_space: 4,
  investment: 5,
  luxury_features: 3,
  storage: 2,
  home_office: 4,
};

export function getInterestScore(topic: string): number {
  return INTEREST_SCORE_WEIGHTS[topic] ?? 1;
}

export function scoreInterests(topics: string[]): Array<{ topic: string; score: number }> {
  const unique = Array.from(new Set(topics));
  return unique.map((topic) => ({
    topic,
    score: getInterestScore(topic),
  }));
}

export function summarizeInterests(
  scored: Array<{ topic: string; score: number }>,
): string {
  if (scored.length === 0) return "No specific interests detected yet.";
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  return sorted.map((item) => `${item.topic} (+${item.score})`).join(", ");
}
