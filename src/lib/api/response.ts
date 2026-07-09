import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
  timestamp: string;
  error: null;
}

export interface ApiFailure {
  success: false;
  data: null;
  error: ApiErrorBody;
  requestId: string;
  timestamp: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function createRequestEnvelope() {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

function codeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    case 429:
      return "RATE_LIMITED";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "API_ERROR";
  }
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: meta ?? {},
      ...createRequestEnvelope(),
      error: null,
    },
    { status },
  );
}

export function apiError(message: string, status = 500, code?: string): NextResponse<ApiFailure> {
  if (status >= 500) {
    logger.error("API error response", { status, code: code ?? codeFromStatus(status), message });
  }

  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: code ?? codeFromStatus(status),
        message,
      },
      ...createRequestEnvelope(),
    },
    { status },
  );
}
