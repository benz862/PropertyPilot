import { notFound } from "next/navigation";

import { QrRoomAgentClient } from "@/components/buyer/qr-room-agent-client";
import { createPropertyAccessService } from "@/lib/property-access";
import { getPublicPropertyBySlugOrId } from "@/lib/public-room-agent/service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicAccessPage({ params }: PageProps) {
  const { token } = await params;
  const access = await createPropertyAccessService();
  const resolution = await access.resolveToken(token);
  const client = await createClient();

  if (resolution && resolution.mode !== "unavailable" && resolution.mode !== "expired") {
    if (resolution.mode === "draft" && !resolution.isPreview) {
      notFound();
    }

    const property = await getPublicPropertyBySlugOrId(client, resolution.slug);
    if (!property) notFound();
    return <QrRoomAgentClient property={property} />;
  }

  const property = await getPublicPropertyBySlugOrId(client, token);
  if (!property) notFound();
  return <QrRoomAgentClient property={property} />;
}
