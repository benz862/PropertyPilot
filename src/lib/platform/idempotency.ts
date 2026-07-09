const operationStore = new Map<string, { fingerprint: string; createdAt: string }>();

export function buildIdempotencyFingerprint(input: {
  method: string;
  path: string;
  body: unknown;
}): string {
  return JSON.stringify({
    method: input.method.toUpperCase(),
    path: input.path,
    body: input.body,
  });
}

export function registerIdempotentOperation(input: {
  key: string;
  fingerprint: string;
}): { accepted: boolean; replay: boolean } {
  const existing = operationStore.get(input.key);
  if (!existing) {
    operationStore.set(input.key, {
      fingerprint: input.fingerprint,
      createdAt: new Date().toISOString(),
    });
    return { accepted: true, replay: false };
  }

  return {
    accepted: existing.fingerprint === input.fingerprint,
    replay: existing.fingerprint === input.fingerprint,
  };
}
