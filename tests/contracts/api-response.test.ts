import { describe, expect, it } from "vitest";

import { apiError, apiSuccess } from "@/lib/api/response";

describe("API response contract", () => {
  it("returns the ENG-004 success envelope", async () => {
    const response = apiSuccess({ ok: true }, 201, { cursor: null });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      success: true,
      data: { ok: true },
      meta: { cursor: null },
      error: null,
    });
    expect(json.requestId).toEqual(expect.any(String));
    expect(json.timestamp).toEqual(expect.any(String));
  });

  it("returns the ENG-004 error envelope", async () => {
    const response = apiError("Property could not be located.", 404, "PROPERTY_NOT_FOUND");
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toMatchObject({
      success: false,
      data: null,
      error: {
        code: "PROPERTY_NOT_FOUND",
        message: "Property could not be located.",
      },
    });
    expect(json.requestId).toEqual(expect.any(String));
    expect(json.timestamp).toEqual(expect.any(String));
  });
});
