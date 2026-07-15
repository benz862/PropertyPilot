#!/usr/bin/env node

/**
 * Exports a Zillow listing through a configured, authorized Apify actor.
 * It intentionally does not request Zillow pages directly or attempt to defeat
 * access controls. The actor and token must be supplied by the account owner.
 *
 * Usage:
 *   APIFY_TOKEN=... APIFY_ZILLOW_ACTOR_ID=owner~actor \
 *     node scripts/export-zillow-listing.mjs 'https://www.zillow.com/homedetails/...'
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

// The CLI runs outside Next.js, so load the root .env.local explicitly. Values
// remain server-side and are never printed by this script.
nextEnv.loadEnvConfig(process.cwd());

const FIELD_ALIASES = {
  address: ["address", "streetAddress", "formattedAddress", "fullAddress"],
  price: ["price", "listPrice", "zestimate"],
  status: ["status", "homeStatus", "listingStatus"],
  beds: ["beds", "bedrooms", "bedroomCount"],
  baths: ["baths", "bathrooms", "bathroomCount"],
  squareFeet: ["livingArea", "livingAreaValue", "squareFeet", "area", "finishedSqFt"],
  lotSize: ["lotSize", "lotAreaValue", "lotSizeSqFt"],
  propertyType: ["propertyType", "homeType", "type"],
  yearBuilt: ["yearBuilt"],
  hoa: ["hoaFee", "hoaFeeTotal", "monthlyHoaFee"],
  taxes: ["annualTaxAmount", "taxAnnualAmount", "propertyTaxes"],
  description: ["description", "resoFacts.description", "publicRemarks"],
  agent: ["listingAgent.name", "listingAgentName", "attributionInfo.agentName"],
  broker: ["brokerName", "listingBroker", "attributionInfo.brokerName"],
  features: ["features", "resoFacts.atAGlanceFacts", "amenities"],
  schools: ["schools", "nearbySchools"],
};

function usage(message) {
  if (message) console.error(`Error: ${message}`);
  console.error("Usage: APIFY_TOKEN=... APIFY_ZILLOW_ACTOR_ID=owner~actor node scripts/export-zillow-listing.mjs <zillow-url> [output-directory]");
  process.exitCode = 1;
}

function getPath(object, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, object);
}

function firstValue(item, aliases) {
  for (const alias of aliases) {
    const value = getPath(item, alias);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asText(value) {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("; ");
  if (typeof value === "object") {
    if (typeof value.name === "string") return value.name;
    if (typeof value.value === "string" || typeof value.value === "number") return String(value.value);
    return Object.entries(value).map(([key, entry]) => `${key}: ${asText(entry)}`).join("; ");
  }
  return String(value);
}

function addressFrom(item) {
  const direct = firstValue(item, FIELD_ALIASES.address);
  if (typeof direct === "object") {
    return [direct.streetAddress, direct.city, direct.state, direct.zipcode].filter(Boolean).join(", ");
  }
  if (direct) return asText(direct);
  return [item.streetAddress, item.city, item.state, item.zipcode].filter(Boolean).join(", ") || "zillow-listing";
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "zillow-listing";
}

function collectPhotoUrls(value, urls = new Set(), context = "") {
  if (typeof value === "string" && /^https:\/\//i.test(value) && /(photo|image|media|img)/i.test(context)) urls.add(value);
  if (Array.isArray(value)) value.forEach((entry) => collectPhotoUrls(entry, urls, context));
  if (value && typeof value === "object") Object.entries(value).forEach(([childKey, entry]) => collectPhotoUrls(entry, urls, `${context}.${childKey}`));
  return [...urls];
}

function canonicalPhotoUrls(listing, actorId) {
  if (actorId === "maxcopell~zillow-detail-scraper") {
    const gallery = listing.originalPhotos ?? listing.responsivePhotos;
    if (!Array.isArray(gallery)) return [];
    const urls = gallery.map((photo) => {
      const jpegVariants = photo?.mixedSources?.jpeg;
      if (Array.isArray(jpegVariants) && jpegVariants.length > 0) {
        return [...jpegVariants]
          .sort((left, right) => (right.width ?? 0) - (left.width ?? 0))[0]?.url;
      }
      return photo?.url;
    }).filter((url) => typeof url === "string" && /^https:\/\//i.test(url));
    return [...new Set(urls)];
  }

  return collectPhotoUrls(listing);
}

function rtfEscape(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/[{}]/g, "\\$&").replace(/\r?\n/g, "\\line ").replace(/[^\x00-\x7f]/g, (character) => {
    const code = character.charCodeAt(0);
    return `\\u${code > 32767 ? code - 65536 : code}?`;
  });
}

function paragraph(text, bold = false) {
  return `{${bold ? "\\b " : ""}${rtfEscape(text)}${bold ? "\\b0" : ""}\\par}\n`;
}

function knowledgeBaseRtf(facts, sourceUrl, photoCount) {
  const summary = `${facts.address} is a ${facts.status.toLowerCase()} ${facts.propertyType.toLowerCase()} listed at ${facts.price}. It has ${facts.beds} bedrooms, ${facts.baths} bathrooms, and ${facts.squareFeet} square feet. ${facts.description === "Not provided" ? "The source did not provide a listing description." : facts.description}`;
  const keyFacts = [
    ["Address", facts.address], ["Price", facts.price], ["Status", facts.status], ["Beds", facts.beds], ["Baths", facts.baths],
    ["Square footage", facts.squareFeet], ["Lot size", facts.lotSize], ["Property type", facts.propertyType], ["Year built", facts.yearBuilt],
    ["HOA", facts.hoa], ["Taxes", facts.taxes], ["Listing agent", facts.agent], ["Listing broker", facts.broker], ["Photos saved", String(photoCount)],
  ];
  let rtf = "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs22\n";
  rtf += paragraph("Listing Knowledge Base", true);
  rtf += paragraph("Voice assistant summary", true) + paragraph(summary);
  rtf += paragraph("Key facts", true);
  keyFacts.forEach(([label, value]) => { rtf += paragraph(`• ${label}: ${value}`); });
  rtf += paragraph("Full description", true) + paragraph(facts.description);
  rtf += paragraph("Features and amenities", true) + paragraph(facts.features);
  rtf += paragraph("Schools", true) + paragraph(facts.schools);
  rtf += paragraph("Cautions and limitations", true);
  rtf += paragraph(`This information was returned by the configured Apify actor for ${sourceUrl}. Listing data, availability, pricing, schools, taxes, and fees can change. Verify all material facts with the listing agent or broker before relying on them.`);
  return `${rtf}}`;
}

async function fetchListing(url, token, actorId) {
  const cachedDatasetId = process.env.APIFY_ZILLOW_DATASET_ID;
  if (cachedDatasetId) {
    const response = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(cachedDatasetId)}/items?limit=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Apify dataset request failed (${response.status}): ${await response.text()}`);
    const items = await response.json();
    if (!Array.isArray(items) || items.length === 0) throw new Error("The specified Apify dataset contains no listing data.");
    return items[0];
  }

  const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  // Actor input schemas are publisher-defined. This Store actor accepts its URL
  // search target in `locations`; retain the conventional `startUrls` payload
  // for other configured actors.
  const input = actorId === "scrapesmith~zillow-scraper"
    ? { locations: [url] }
    : actorId === "maxcopell~zillow-detail-scraper"
      ? { startUrls: [{ url }], propertyStatus: "FOR_SALE" }
      : { startUrls: [{ url }] };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Apify actor request failed (${response.status}): ${await response.text()}`);
  const items = await response.json();
  if (!Array.isArray(items) || items.length === 0) throw new Error("The Apify actor returned no listing data.");
  return items[0];
}

async function downloadPhoto(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.startsWith("image/")) throw new Error(`not an image response (${response.status}, ${contentType || "unknown content type"})`);
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  await writeFile(destination.replace(/\.jpg$/, `.${extension}`), Buffer.from(await response.arrayBuffer()));
  return extension;
}

async function main() {
  const [url, root = "output/zillow-listings"] = process.argv.slice(2);
  if (!url || !/^https:\/\/(www\.)?zillow\.com\//i.test(url)) return usage("Provide a valid https Zillow listing URL.");
  const { APIFY_TOKEN: token, APIFY_ZILLOW_ACTOR_ID: actorId } = process.env;
  if (!token || !actorId) return usage("APIFY_TOKEN and APIFY_ZILLOW_ACTOR_ID are required.");

  const listing = await fetchListing(url, token, actorId);
  const facts = Object.fromEntries(Object.entries(FIELD_ALIASES).map(([key, aliases]) => [key, asText(firstValue(listing, aliases))]));
  facts.address = addressFrom(listing);
  const slug = slugify(facts.address);
  const listingDir = path.resolve(root, slug);
  await mkdir(listingDir, { recursive: true });
  const photoDir = path.join(listingDir, "photos");
  await mkdir(photoDir, { recursive: true });

  const photos = canonicalPhotoUrls(listing, actorId);
  const failures = [];
  let saved = 0;
  for (const [index, photoUrl] of photos.entries()) {
    const target = path.join(photoDir, `${String(index + 1).padStart(2, "0")}.jpg`);
    try { await downloadPhoto(photoUrl, target); saved += 1; }
    catch (error) { failures.push({ photoUrl, reason: error instanceof Error ? error.message : "download failed" }); }
  }
  const knowledgePath = path.resolve(root, `${slug}-knowledge-base.rtf`);
  await writeFile(knowledgePath, knowledgeBaseRtf(facts, url, saved), "utf8");
  await writeFile(path.join(listingDir, "export-log.json"), JSON.stringify({ sourceUrl: url, savedAt: new Date().toISOString(), listingFolder: listingDir, photoFolder: photoDir, knowledgeBase: knowledgePath, photoUrlsFound: photos.length, photosSaved: saved, failedDownloads: failures, rawListing: listing }, null, 2));
  console.log(JSON.stringify({ listingFolder: listingDir, photoFolder: photoDir, knowledgeBase: knowledgePath, photoUrlsFound: photos.length, photosSaved: saved, failedDownloads: failures.length }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
