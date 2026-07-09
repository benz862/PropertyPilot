import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAuthenticatedUser } from "@/lib/api/auth";
import { createEnterpriseService } from "@/lib/enterprise";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const enterprise = await createEnterpriseService();
    const org = enterprise.getOrganizationForUser(user.id);
    return apiSuccess({
      organization: org,
      offices: org ? enterprise.listOffices(org.id) : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enterprise fetch failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = (await request.json()) as { name: string };
    const enterprise = await createEnterpriseService();
    const org = enterprise.createOrganization({ name: body.name, ownerId: user.id });
    return apiSuccess(org, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Organization creation failed";
    return apiError(message, message === "Unauthorized" ? 401 : 500);
  }
}
