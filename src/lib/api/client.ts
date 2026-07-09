import type { ApiResponse } from "@/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.error) {
    const error =
      typeof payload.error === "string"
        ? { message: payload.error, code: undefined }
        : payload.error;
    throw new ApiClientError(
      error?.message ?? "API request failed",
      response.status,
      error?.code,
    );
  }

  return payload.data as T;
}
