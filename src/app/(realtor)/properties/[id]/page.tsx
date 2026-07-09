import { redirect } from "next/navigation";

import { realtorRoutes } from "@/lib/navigation/routes";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  redirect(realtorRoutes.propertySection(id, "overview"));
}
