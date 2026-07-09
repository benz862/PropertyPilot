import { apiSuccess } from "@/lib/api/response";
import { calculateVersionOneReadiness, VERSION_ONE_CHECKLIST } from "@/lib/product/version-1";

export const runtime = "nodejs";

export async function GET() {
  const implementedKeys = VERSION_ONE_CHECKLIST.map((item) => item.key);
  return apiSuccess(calculateVersionOneReadiness(implementedKeys));
}
