export const APP_LIMITS = {
  defaultPageSize: 25,
  maxPageSize: 50,
  workspaceSearchDebounceMs: 300,
  publicRateLimitPerMinute: 60,
  authenticatedRateLimitPerMinute: 600,
  aiResponseMaxTokens: 300,
} as const;

export const TIME = {
  secondMs: 1000,
  minuteMs: 60_000,
  dayMs: 86_400_000,
} as const;
