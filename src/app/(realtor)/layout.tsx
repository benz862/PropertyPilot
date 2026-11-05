import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/api/auth";

export default async function RealtorGroupLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return children;
}
