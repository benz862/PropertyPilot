import fs from "node:fs";

const loadDotEnvFile = (path) => {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [name, ...rawValue] = trimmed.split("=");
    if (process.env[name]) continue;

    process.env[name] = rawValue.join("=").replace(/^['"]|['"]$/g, "");
  }
};

loadDotEnvFile(".env.local");

const requiredByEnvironment = {
  local: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  development: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  preview: [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  staging: [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
  ],
  production: [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "GHL_API_KEY",
    "GHL_LOCATION_ID",
  ],
};

const environment = process.env.DEPLOY_ENV ?? process.env.VERCEL_ENV ?? "local";
const required = requiredByEnvironment[environment] ?? requiredByEnvironment.local;
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing ${environment} environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Environment validation passed for ${environment}.`);
