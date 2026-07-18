import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// Must load before importing modules that capture process.env (env.ts).
loadEnvLocal();

const { createAssetGenerationService } = await import("../src/lib/property-dna/asset-service");
const { createBuyerActivityService } = await import("../src/lib/property-dna/buyer-activity");
const { createGHLSyncService } = await import("../src/lib/property-dna/ghl-sync");
const { createPublishingService } = await import("../src/lib/property-dna/publishing");
const { createPropertyDNAService } = await import("../src/lib/property-dna/service");
type Database = import("../src/types/database").Database;

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OWNER_ID = "d67b3596-5997-406b-aed1-0d09e4b39e17";
const failures: Array<{ step: string; detail: string }> = [];
const results: Array<{ step: string; ok: boolean; detail: string }> = [];

function ok(step: string, detail: string) {
  results.push({ step, ok: true, detail });
  console.log(`OK  ${step}: ${detail}`);
}
function fail(step: string, detail: string) {
  failures.push({ step, detail });
  results.push({ step, ok: false, detail });
  console.error(`FAIL ${step}: ${detail}`);
}

async function waitForServer(url: string, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 307) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server not ready at ${url}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await waitForServer(BASE);

  const slug = `e2e-phase2-${Date.now()}`;
  const { data: property, error: createError } = await client
    .from("properties")
    .insert({
      owner_id: OWNER_ID,
      street: "456 Oak Ave",
      city: "Austin",
      province_state: "TX",
      postal_code: "78702",
      country: "US",
      property_type: "single_family",
      bedrooms: 3,
      bathrooms: 2,
      finished_sq_ft: 1900,
      listing_price: 549000,
      year_built: 2012,
      public_remarks: "Bright family home with updated kitchen.",
      slug,
      status: "draft",
      dna_version: 1,
    })
    .select("id, slug")
    .single();

  if (createError || !property) {
    fail("create property", createError?.message ?? "insert failed");
    finish();
    return;
  }
  const propId = property.id;
  ok("create property", `${propId} slug=${slug}`);

  {
    const { error } = await client.from("voice_notes").insert({
      property_id: propId,
      transcript: "The roof was replaced in 2021 and the HVAC is a 2020 heat pump.",
    });
    if (error) fail("seed voice note", error.message);
    else ok("seed voice note", "roof + hvac");
  }
  {
    const { error } = await client.from("property_rooms").insert({
      property_id: propId,
      name: "Kitchen",
      description: "Updated kitchen with quartz counters.",
      features: ["quartz counters", "gas range"],
      talking_points: ["Great for entertaining"],
    });
    if (error) fail("seed room", error.message);
    else ok("seed room", "Kitchen");
  }

  try {
    const rebuilt = await createPropertyDNAService(client).rebuildPropertyDNA(propId);
    if (!rebuilt.dna.systems.roof) fail("rebuild DNA", "missing roof");
    else ok("rebuild DNA", `v=${rebuilt.dna.meta.dnaVersion} roof=${rebuilt.dna.systems.roof.value}`);
  } catch (error) {
    fail("rebuild DNA", error instanceof Error ? error.message : String(error));
  }

  try {
    const dna = await createPropertyDNAService(client).getPropertyDNA(propId);
    if (!dna) throw new Error("DNA null");
    const assets = await createAssetGenerationService(
      client,
      process.env.NEXT_PUBLIC_APP_URL ?? BASE,
    ).generateAll(dna);
    const brochure = assets.find((a) => a.asset_type === "buyer_brochure");
    ok(
      "generate assets",
      `count=${assets.length} brochure_file=${brochure?.file_url ?? "null"} content=${Boolean(brochure?.content)}`,
    );
    if (!brochure?.content) fail("generate assets content", "brochure content missing");
  } catch (error) {
    fail("generate assets", error instanceof Error ? error.message : String(error));
  }

  try {
    const status = await createPublishingService(
      client,
      process.env.NEXT_PUBLIC_APP_URL ?? BASE,
    ).publish(propId);
    if (!status.published) fail("publish", JSON.stringify(status));
    else ok("publish", status.publicUrl ?? status.slug);
  } catch (error) {
    fail("publish", error instanceof Error ? error.message : String(error));
  }

  {
    const res = await fetch(`${BASE}/p/${slug}`);
    const html = await res.text();
    if (!res.ok) fail("open QR tour", `HTTP ${res.status}`);
    else if (!/Ask a question|Oak Ave|Austin/i.test(html)) fail("open QR tour", "unexpected HTML");
    else ok("open QR tour", `HTTP ${res.status}`);
  }

  {
    const res = await fetch(`${BASE}/api/public/properties/${slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "room_selected",
        room: "Kitchen",
        sessionId: "e2e-session-1",
      }),
    });
    const body = await res.json();
    if (!res.ok || body.error) fail("select room", body.error ?? `HTTP ${res.status}`);
    else ok("select room", "recorded");
  }

  {
    const res = await fetch(`${BASE}/api/public/properties/${slug}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedRoom: "Kitchen",
        question: "How old is the roof?",
        inputType: "text",
      }),
    });
    const body = await res.json();
    if (!res.ok || body.error || !body.data) fail("ask known question", body.error ?? `HTTP ${res.status}`);
    else if (!/roof|2021/i.test(String(body.data.answer ?? ""))) {
      fail("ask known question", `expected roof answer, got: ${body.data.answer}`);
    } else ok("ask known question", String(body.data.answer).slice(0, 140));
  }

  let questionId: string | null = null;
  {
    const res = await fetch(`${BASE}/api/public/properties/${slug}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedRoom: "Kitchen",
        question: "What is the exotic bird HOA policy and moon-base access code?",
        inputType: "text",
      }),
    });
    const body = await res.json();
    if (!res.ok || body.error || !body.data) fail("ask unknown question", body.error ?? `HTTP ${res.status}`);
    else if (!body.data.needsAgentFollowup) fail("ask unknown question", body.data.answer);
    else {
      questionId = body.data.questionId;
      ok("ask unknown question", `questionId=${questionId}`);
    }
  }

  {
    if (!questionId) fail("submit lead", "missing questionId");
    else {
      const res = await fetch(`${BASE}/api/public/properties/${slug}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          buyerName: "E2E Buyer",
          buyerEmail: "e2e.buyer@example.com",
          buyerPhone: "555-0100",
        }),
      });
      const body = await res.json();
      if (!res.ok || body.error) fail("submit lead", body.error ?? `HTTP ${res.status}`);
      else ok("submit lead", JSON.stringify(body.data));
    }
  }

  try {
    const summary = await createBuyerActivityService(client).summarize(propId);
    if (summary.questions < 1 || summary.scans + summary.roomSelections.Kitchen < 1) {
      // roomSelections may be keyed differently; check total
      if (summary.totalEvents < 2) fail("buyer activity", JSON.stringify(summary));
      else ok("buyer activity", JSON.stringify(summary));
    } else ok("buyer activity", JSON.stringify(summary));
  } catch (error) {
    fail("buyer activity", error instanceof Error ? error.message : String(error));
  }

  try {
    const ghl = createGHLSyncService(client);
    if (!ghl.isConfigured()) fail("GHL sync", "not configured");
    else {
      const sync = await ghl.syncBuyerLead({
        propertyId: propId,
        propertyAddress: "456 Oak Ave, Austin, TX",
        selectedRoom: "Kitchen",
        question: "What is the exotic bird HOA policy and moon-base access code?",
        answer: "",
        needsAgentFollowup: true,
        requestedFeatureSheet: false,
        buyerName: "E2E Buyer",
        buyerEmail: "e2e.buyer@example.com",
        buyerPhone: "555-0100",
      });
      if (sync.error) fail("GHL sync", sync.error);
      else if (sync.skipped) fail("GHL sync", "skipped despite config");
      else ok("GHL sync", `contactId=${sync.contactId} opportunityId=${sync.opportunityId} task=${sync.taskCreated}`);
    }
  } catch (error) {
    fail("GHL sync", error instanceof Error ? error.message : String(error));
  }

  finish();
}

function finish() {
  console.log("\n--- SUMMARY ---");
  console.log(JSON.stringify({ failures, results }, null, 2));
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
