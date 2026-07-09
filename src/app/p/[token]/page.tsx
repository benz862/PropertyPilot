import { redirect, notFound } from "next/navigation";

import { createPropertyAccessService } from "@/lib/property-access";
import { buyerRoutes } from "@/lib/navigation/routes";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicAccessPage({ params }: PageProps) {
  const { token } = await params;
  const access = await createPropertyAccessService();
  const resolution = await access.resolveToken(token);

  if (!resolution || resolution.mode === "unavailable" || resolution.mode === "expired") {
    notFound();
  }

  if (resolution.mode === "draft" && !resolution.isPreview) {
    notFound();
  }

  redirect(buyerRoutes.welcome(resolution.slug));
}
