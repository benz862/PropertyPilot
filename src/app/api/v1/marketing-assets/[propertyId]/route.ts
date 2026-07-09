import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createMarketingAssetService } from "@/lib/marketing-assets";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ propertyId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAuthenticatedUser();
    const { propertyId } = await params;
    const service = await createMarketingAssetService();
    const assets = await service.listAssets(propertyId);
    return apiSuccess(assets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assets";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuthenticatedUser();
    const { propertyId } = await params;
    const body = (await request.json()) as { theme?: string; assetTypes?: string[] };
    const service = await createMarketingAssetService();
    const job = await service.generateAssets({
      propertyId,
      theme: body.theme as import("@/lib/marketing-assets").AssetTheme | undefined,
      assetTypes: body.assetTypes as import("@/lib/marketing-assets").AssetType[] | undefined,
      actorId: user.id,
    });
    return apiSuccess(job, 202);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError(message, status);
  }
}
