import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types";

export async function GET() {
  const response: ApiResponse<{ status: string; version: string }> = {
    data: {
      status: "ok",
      version: "0.1.0",
    },
    error: null,
  };

  return NextResponse.json(response);
}
