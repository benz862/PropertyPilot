"use client";

import Image from "next/image";
import { useState } from "react";

import { PhotoStagingDialog } from "@/components/realtor/photo-staging-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KNOWLEDGE_CATEGORY_GROUPS,
  KNOWLEDGE_GROUP_LABELS,
  type KnowledgeGroupKey,
} from "@/lib/realtor-workspace/types";
import { getPhotoPublicUrl } from "@/lib/storage/photo-url";
import type { KnowledgeCategory, KnowledgeObject, Photo, PropertyTwinContext } from "@/types/database";

interface KnowledgeSectionProps {
  context: PropertyTwinContext;
}

export function KnowledgeSection({ context }: KnowledgeSectionProps) {
  const grouped = groupKnowledgeObjects(context.knowledgeObjects);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Knowledge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {context.knowledgeObjects.length} knowledge objects · searchable and grouped by category
        </p>
      </div>

      {context.knowledgeObjects.length === 0 ? (
        <EmptySection message="No knowledge objects yet. Run the AI build or add facts manually." />
      ) : (
        <div className="space-y-8">
          {(Object.keys(KNOWLEDGE_GROUP_LABELS) as KnowledgeGroupKey[]).map((group) => {
            const items = grouped[group];
            if (!items?.length) return null;
            return (
              <section key={group}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
                  {KNOWLEDGE_GROUP_LABELS[group]}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((ko) => (
                    <KnowledgeObjectCard key={ko.id} object={ko} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KnowledgeObjectCard({ object }: { object: KnowledgeObject }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{object.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-xs capitalize">
            {object.confidence_level}
          </Badge>
        </div>
        <CardDescription className="capitalize">{object.category.replace(/_/g, " ")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        {object.summary && <p className="text-sm text-foreground">{object.summary}</p>}
        <dl className="grid grid-cols-2 gap-2">
          <div>
            <dt>Verification</dt>
            <dd className="font-medium text-foreground">
              {object.verification_source ?? "Pending"}
            </dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd className="font-medium text-foreground">v{object.revision_number}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd className="font-medium text-foreground capitalize">
              {object.verification_source ?? "Manual"}
            </dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd className="font-medium text-foreground">
              {new Date(object.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function groupKnowledgeObjects(
  objects: KnowledgeObject[],
): Partial<Record<KnowledgeGroupKey, KnowledgeObject[]>> {
  const groups: Partial<Record<KnowledgeGroupKey, KnowledgeObject[]>> = {};

  for (const object of objects) {
    const group =
      KNOWLEDGE_CATEGORY_GROUPS[object.category as KnowledgeCategory] ?? "features";
    const existing = groups[group] ?? [];
    existing.push(object);
    groups[group] = existing;
  }

  return groups;
}

interface PhotosSectionProps {
  context: PropertyTwinContext;
}

export function PhotosSection({ context }: PhotosSectionProps) {
  const photos = context.photos;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Photo Center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {photos.length} photos · drag-and-drop upload, AI analysis, and virtual staging
        </p>
      </div>

      {photos.length === 0 ? (
        <EmptySection message="Upload photos to enable AI room detection and coverage analysis." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} propertyId={context.property.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({ propertyId, photo }: { propertyId: string; photo: Photo }) {
  const url = getPhotoPublicUrl(photo);
  const [stagingOpen, setStagingOpen] = useState(false);
  const isVirtuallyStaged = photo.tags?.includes("virtually-staged");

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/3] bg-secondary">
          {url ? (
            <Image src={url} alt={photo.caption ?? "Property photo"} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No preview
            </div>
          )}
          {photo.is_duplicate && (
            <Badge className="absolute right-2 top-2" variant="destructive">
              Duplicate
            </Badge>
          )}
          {isVirtuallyStaged && (
            <Badge className="absolute left-2 top-2" variant="secondary">
              Virtually staged
            </Badge>
          )}
        </div>
        <CardContent className="space-y-2 p-3">
          <p className="truncate text-sm font-medium">{photo.caption ?? photo.detected_room ?? "Photo"}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {photo.analysis_status ?? "pending"} analysis
            {photo.detected_room ? ` · ${photo.detected_room}` : ""}
          </p>
          {!isVirtuallyStaged ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setStagingOpen(true)}
            >
              Stage
            </Button>
          ) : null}
        </CardContent>
      </Card>
      <PhotoStagingDialog
        open={stagingOpen}
        onOpenChange={setStagingOpen}
        propertyId={propertyId}
        photo={photo}
      />
    </>
  );
}

interface DocumentsSectionProps {
  context: PropertyTwinContext;
}

export function DocumentsSection({ context }: DocumentsSectionProps) {
  const grouped = groupDocuments(context.documents);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Document Center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {context.documents.length} documents organized by type
        </p>
      </div>

      {context.documents.length === 0 ? (
        <EmptySection message="Upload inspection reports, disclosures, and warranties." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, docs]) => (
            <section key={type}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
                {type}
              </h3>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          {doc.requires_review ? " · Needs review" : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {doc.searchable_content ? "Indexed" : "Pending index"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupDocuments(documents: PropertyTwinContext["documents"]) {
  const groups: Record<string, typeof documents> = {};

  for (const doc of documents) {
    const label = doc.document_type.replace(/_/g, " ");
    const existing = groups[label] ?? [];
    existing.push(doc);
    groups[label] = existing;
  }

  return groups;
}

function EmptySection({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
