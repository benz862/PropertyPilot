export interface ApiResponse<T> {
  success?: boolean;
  data: T | null;
  error: string | { code: string; message: string } | null;
  meta?: Record<string, unknown>;
  requestId?: string;
  timestamp?: string;
}
