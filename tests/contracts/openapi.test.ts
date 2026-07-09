import { describe, expect, it } from "vitest";

import { buildOpenApiDocument } from "@/lib/api/openapi";

describe("OpenAPI contract", () => {
  it("documents versioned API routes with the standard response schema", () => {
    const document = buildOpenApiDocument();

    expect(document.openapi).toBe("3.1.0");
    expect(document.servers[0]?.url).toBe("/api/v1");
    expect(document.paths["/health"]?.get).toBeDefined();
    expect(document.paths["/search"]?.post).toBeDefined();
    expect(document.components.schemas.ApiSuccess).toBeDefined();
    expect(document.components.schemas.ApiError).toBeDefined();
  });
});
