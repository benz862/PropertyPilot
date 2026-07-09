import { realtorRoutes } from "@/lib/navigation/routes";
import {
  getGeneratedPdfsForOwner,
  getOwnerLeads,
  getOwnerProperties,
  getUnansweredQuestionsForOwner,
  getWorkspaceOwnerId,
} from "@/lib/repositories/workspace-repository";
import { getKnowledgeObjects, getPhotos, getDocuments } from "@/lib/repositories/property-repository";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import { formatPropertyAddress, type SearchResultGroup } from "./types";

export async function searchWorkspace(query: string): Promise<SearchResultGroup[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  if (!env.supabase.url || !env.supabase.anonKey) {
    return [];
  }

  const client = await createClient();
  const ownerId = await getWorkspaceOwnerId(client);
  if (!ownerId) {
    return [];
  }

  return searchForOwner(client, ownerId, trimmed);
}

export async function searchForOwner(
  client: SupabaseClient<Database>,
  ownerId: string,
  query: string,
): Promise<SearchResultGroup[]> {
  const properties = await getOwnerProperties(client, ownerId);
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const propertyResults = properties
    .filter(
      (p) =>
        p.street.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query),
    )
    .map((p) => ({
      id: p.id,
      title: formatPropertyAddress(p),
      subtitle: p.status,
      href: realtorRoutes.propertySection(p.id, "overview"),
      propertyId: p.id,
    }));

  const knowledgeResults: SearchResultGroup["results"] = [];
  const photoResults: SearchResultGroup["results"] = [];
  const documentResults: SearchResultGroup["results"] = [];

  for (const property of properties) {
    const [knowledge, photos, documents] = await Promise.all([
      getKnowledgeObjects(client, property.id),
      getPhotos(client, property.id),
      getDocuments(client, property.id),
    ]);

    for (const ko of knowledge) {
      if (
        ko.name.toLowerCase().includes(query) ||
        ko.summary?.toLowerCase().includes(query) ||
        ko.category.toLowerCase().includes(query)
      ) {
        knowledgeResults.push({
          id: ko.id,
          title: ko.name,
          subtitle: `${formatPropertyAddress(property)} · ${ko.category}`,
          href: realtorRoutes.propertySection(property.id, "knowledge"),
          propertyId: property.id,
        });
      }
    }

    for (const photo of photos) {
      if (
        photo.caption?.toLowerCase().includes(query) ||
        photo.detected_room?.toLowerCase().includes(query) ||
        photo.ai_description?.toLowerCase().includes(query)
      ) {
        photoResults.push({
          id: photo.id,
          title: photo.caption ?? photo.detected_room ?? "Photo",
          subtitle: formatPropertyAddress(property),
          href: realtorRoutes.propertySection(property.id, "photos"),
          propertyId: property.id,
        });
      }
    }

    for (const doc of documents) {
      if (
        doc.title.toLowerCase().includes(query) ||
        doc.document_type.toLowerCase().includes(query)
      ) {
        documentResults.push({
          id: doc.id,
          title: doc.title,
          subtitle: `${formatPropertyAddress(property)} · ${doc.document_type}`,
          href: realtorRoutes.propertySection(property.id, "documents"),
          propertyId: property.id,
        });
      }
    }
  }

  const leads = await getOwnerLeads(client, ownerId, 50);
  const leadResults = leads
    .filter(
      (lead) =>
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query),
    )
    .map((lead) => ({
      id: lead.id,
      title: lead.name ?? lead.email ?? "Lead",
      subtitle: `${lead.property.street}, ${lead.property.city}`,
      href: realtorRoutes.leads,
      propertyId: lead.property_id,
    }));

  const questions = await getUnansweredQuestionsForOwner(client, ownerId, 50);
  const questionResults = questions
    .filter((q) => q.question.toLowerCase().includes(query))
    .map((q) => {
      const property = propertyMap.get(q.property_id);
      return {
        id: q.id,
        title: q.question,
        subtitle: property ? formatPropertyAddress(property) : "Property",
        href: property
          ? realtorRoutes.propertySection(property.id, "buyer-questions")
          : realtorRoutes.dashboard,
        propertyId: q.property_id,
      };
    });

  const pdfs = await getGeneratedPdfsForOwner(client, ownerId);
  const assetResults = pdfs
    .filter(
      (pdf) =>
        pdf.title.toLowerCase().includes(query) ||
        pdf.property.street.toLowerCase().includes(query),
    )
    .map((pdf) => ({
      id: pdf.id,
      title: pdf.title,
      subtitle: `${pdf.property.street}, ${pdf.property.city}`,
      href: realtorRoutes.propertySection(pdf.property_id, "generated-assets"),
      propertyId: pdf.property_id,
    }));

  const groups: SearchResultGroup[] = [];

  if (propertyResults.length > 0) {
    groups.push({ type: "properties", label: "Properties", results: propertyResults.slice(0, 8) });
  }
  if (knowledgeResults.length > 0) {
    groups.push({ type: "knowledge", label: "Knowledge", results: knowledgeResults.slice(0, 8) });
  }
  if (photoResults.length > 0) {
    groups.push({ type: "photos", label: "Photos", results: photoResults.slice(0, 8) });
  }
  if (documentResults.length > 0) {
    groups.push({ type: "documents", label: "Documents", results: documentResults.slice(0, 8) });
  }
  if (leadResults.length > 0) {
    groups.push({ type: "leads", label: "Leads", results: leadResults.slice(0, 8) });
  }
  if (questionResults.length > 0) {
    groups.push({ type: "questions", label: "Questions", results: questionResults.slice(0, 8) });
  }
  if (assetResults.length > 0) {
    groups.push({ type: "assets", label: "Generated Assets", results: assetResults.slice(0, 8) });
  }

  return groups;
}
