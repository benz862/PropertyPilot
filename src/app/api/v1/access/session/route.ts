import { apiError, apiSuccess } from "@/lib/api/response";
import { createPropertyAccessService } from "@/lib/property-access";

export const runtime = "nodejs";

interface SessionBody {
  propertyId: string;
  sessionToken?: string;
  entryMethod?: "qr" | "direct_url" | "shared_link" | "preview";
  userAgent?: string;
  acceptLanguage?: string | null;
  isPreview?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SessionBody;
    if (!body.propertyId) return apiError("propertyId is required", 400);

    const access = await createPropertyAccessService();
    const session = await access.createSession({
      propertyId: body.propertyId,
      sessionToken: body.sessionToken,
      entryMethod: body.entryMethod,
      userAgent: body.userAgent ?? request.headers.get("user-agent") ?? undefined,
      acceptLanguage: body.acceptLanguage ?? request.headers.get("accept-language"),
      isPreview: body.isPreview,
    });
    return apiSuccess(session, 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Session creation failed");
  }
}
