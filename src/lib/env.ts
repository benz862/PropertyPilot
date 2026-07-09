function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

export const env = {
  appUrl: getOptionalEnvVar("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  supabase: {
    url: getOptionalEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getOptionalEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getOptionalEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  },
  openai: {
    apiKey: getOptionalEnvVar("OPENAI_API_KEY"),
  },
  stripe: {
    secretKey: getOptionalEnvVar("STRIPE_SECRET_KEY"),
    webhookSecret: getOptionalEnvVar("STRIPE_WEBHOOK_SECRET"),
    publishableKey: getOptionalEnvVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  },
  resend: {
    apiKey: getOptionalEnvVar("RESEND_API_KEY"),
    fromEmail: getOptionalEnvVar("RESEND_FROM_EMAIL"),
  },
  ghl: {
    privateIntegrationToken: getOptionalEnvVar("GHL_PRIVATE_INTEGRATION_TOKEN"),
    locationId: getOptionalEnvVar("GHL_LOCATION_ID"),
  },
} as const;

export function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
  };
}

export function requireOpenAIEnv() {
  return {
    apiKey: getEnvVar("OPENAI_API_KEY"),
  };
}
