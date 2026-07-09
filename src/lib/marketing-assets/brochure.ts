import { PROPERTY_CONCIERGE_PROMPT } from "@/lib/ai/reasoning/engine";

import type { AssetTemplate } from "./templates";

export const BROCHURE_GENERATOR_VERSION = "1.0.0";

export interface BrochureVersionManifest {
  templateVersion: string;
  promptKey: string;
  promptVersion: string;
  knowledgeVersion: number;
  generationTimestamp: string;
  generatorVersion: string;
  assetSelection: string[];
  photoSelection: string[];
  sections: string[];
}

export function buildBrochureVersionManifest(input: {
  template: AssetTemplate;
  knowledgeVersion: number;
  assetSelection: string[];
  photoSelection: string[];
}): BrochureVersionManifest {
  return {
    templateVersion: input.template.version,
    promptKey: PROPERTY_CONCIERGE_PROMPT.key,
    promptVersion: PROPERTY_CONCIERGE_PROMPT.version,
    knowledgeVersion: input.knowledgeVersion,
    generationTimestamp: new Date().toISOString(),
    generatorVersion: BROCHURE_GENERATOR_VERSION,
    assetSelection: input.assetSelection,
    photoSelection: input.photoSelection,
    sections: input.template.sections,
  };
}
