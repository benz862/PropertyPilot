export interface PlatformEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: string;
  version: number;
  aggregateId: string;
  payload: Readonly<TPayload>;
  occurredAt: string;
}

export function createPlatformEvent<TPayload extends Record<string, unknown>>(input: {
  type: string;
  aggregateId: string;
  payload: TPayload;
  version?: number;
}): PlatformEvent<TPayload> {
  return Object.freeze({
    id: crypto.randomUUID(),
    type: input.type,
    version: input.version ?? 1,
    aggregateId: input.aggregateId,
    payload: Object.freeze({ ...input.payload }),
    occurredAt: new Date().toISOString(),
  });
}
