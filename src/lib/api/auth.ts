import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function validateApiKey(request: Request): boolean {
  const key = request.headers.get("x-api-key");
  const expected = process.env.PLATFORM_API_KEY;
  if (!expected) {
    return false;
  }
  return key === expected;
}
