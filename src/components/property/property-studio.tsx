"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudioSection, StudioSectionMeta } from "@/lib/property-dna/asset-generation";
import type { GeneratedAssetType } from "@/lib/property-dna/types";

interface AssetDefinition {
  type: GeneratedAssetType;
  title: string;
  section: StudioSection;
}

interface StudioAsset {
  asset_type: string;
  title: string;
  content: string | null;
  file_url: string | null;
  status: string;
  last_generated_at: string;
}

interface PropertyStudioProps {
  propertyId: string;
  sections: StudioSectionMeta[];
  definitions: AssetDefinition[];
  initialAssets: StudioAsset[];
}

export function PropertyStudio({ propertyId, sections, definitions, initialAssets }: PropertyStudioProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<Record<string, StudioAsset>>(() => indexAssets(initialAssets));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = useMemo(() => groupBySection(sections, definitions), [sections, definitions]);

  async function generate(assetType?: GeneratedAssetType) {
    setBusy(assetType ?? "all");
    setError(null);
    try {
      const response = await fetch(`/api/properties/${propertyId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetType ? { assetType } : {}),
      });
      const payload = (await response.json()) as { data: StudioAsset[] | null; error: string | null };
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Generation failed");
      setAssets((current) => {
        const next = { ...current };
        for (const asset of payload.data ?? []) {
          if (asset) next[asset.asset_type] = asset;
        }
        return next;
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  async function copy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // clipboard may be unavailable; no-op
    }
  }

  const generatedCount = Object.keys(assets).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Property Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every asset is generated from Property DNA · {generatedCount}/{definitions.length} generated
          </p>
        </div>
        <Button onClick={() => generate()} disabled={busy !== null}>
          {busy === "all" ? "Generating…" : "Generate all assets"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {grouped.map((group) => (
        <section key={group.section.id} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.section.label}</h3>
            <p className="text-xs text-muted-foreground">{group.section.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.definitions.map((definition) => {
              const asset = assets[definition.type];
              const isExpanded = expanded === definition.type;
              return (
                <Card key={definition.type}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{definition.title}</CardTitle>
                      <Badge variant={asset ? "default" : "outline"}>{asset ? "Generated" : "Not generated"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {asset ? `Updated ${new Date(asset.last_generated_at).toLocaleString()}` : "Generate from Property DNA"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={asset ? "outline" : "default"}
                        onClick={() => generate(definition.type)}
                        disabled={busy !== null}
                      >
                        {busy === definition.type ? "Working…" : asset ? "Regenerate" : "Generate"}
                      </Button>
                      {asset?.content && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpanded(isExpanded ? null : definition.type)}
                          >
                            {isExpanded ? "Hide" : "Preview"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copy(asset.content ?? "")}>
                            Copy
                          </Button>
                        </>
                      )}
                      {asset?.file_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={asset.file_url} target="_blank" rel="noopener noreferrer" download>
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                    {isExpanded && asset?.content && (
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-xs">
                        {asset.content}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function indexAssets(assets: StudioAsset[]): Record<string, StudioAsset> {
  const map: Record<string, StudioAsset> = {};
  for (const asset of assets) map[asset.asset_type] = asset;
  return map;
}

function groupBySection(sections: StudioSectionMeta[], definitions: AssetDefinition[]) {
  return sections
    .map((section) => ({
      section,
      definitions: definitions.filter((definition) => definition.section === section.id),
    }))
    .filter((group) => group.definitions.length > 0);
}
