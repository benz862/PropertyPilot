import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createAiOpsService } from "@/lib/ai-ops";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ propertyId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { propertyId } = await params;
    const ops = await createAiOpsService();
    const gaps = ops.getKnowledgeGaps(propertyId);
    const queue = ops.getImprovementQueue(propertyId);
    return apiSuccess({ gaps, queue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI ops fetch failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { propertyId } = await params;
    const body = (await request.json()) as {
      conversationId: string;
      transcript: Array<{ role: string; content: string }>;
    };
    const ops = await createAiOpsService();
    const review = ops.analyzeConversation({
      conversationId: body.conversationId,
      propertyId,
      transcript: body.transcript,
    });
    return apiSuccess(review, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
