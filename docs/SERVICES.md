# PropertyPilot Public Services

Engine-layer services live under `src/lib/property-dna/`. Each responsibility has a single implementation.

## PropertyDNAService (`service.ts`)

- **Read**: `getPropertyDNA(slugOrId)` assembles normalized Property DNA from all knowledge sources.
- **Recommendations**: `getRecommendations(slugOrId)` runs the recommendation engine on DNA.
- **Rebuild**: `rebuildPropertyDNA(propertyId)` bumps `dna_version`, marks studio assets `needs_refresh`, and returns fresh DNA + recommendations.
- **API**: `GET /api/properties/[id]/dna`, `POST /api/properties/[id]/dna/rebuild`

## QuestionAnsweringService (`question-answering.ts`)

- **Pure function**: `answerQuestionFromDNA(dna, question, room?)` — no OpenAI; ranks facts from DNA.
- **Production**: Used by `PublicRoomAgentService.askRoomQuestion()` for live QR Q&A.
- **API**: `POST /api/public/properties/[slug]/ask`

## RecommendationService (`recommendations.ts`)

- **Pure function**: `generateRecommendations(dna)` — prioritized “make this property better” suggestions.
- **Production**: Overview, Make Better panel, property layout copilot, `GET /api/properties/[id]/recommendations`.

## AssetGenerationService (`asset-service.ts` + `asset-generation.ts`)

- Generates markdown assets from DNA; PDF/PNG rendered via `asset-render.ts` and stored in Supabase Storage.
- **API**: `GET|POST /api/properties/[id]/assets`

## PublishingService (`publishing.ts`)

- Publish/unpublish properties and build public QR tour URLs.
- **API**: `POST /api/properties/[id]/publish`

## BuyerActivityService (`buyer-activity.ts`)

- Best-effort analytics via `analytics_events`; never throws.
- **API**: `POST /api/public/properties/[slug]/event` (public), summarized in Buyer Activity tab.

## GHLSyncService (`ghl-sync.ts`)

- Syncs contacts, tags, notes, tasks, and optional opportunities to GoHighLevel.
- Never throws; failures do not affect buyer experience.

## Public pages

- QR tour: `/p/[token]`
- Public ask: `POST /api/public/properties/[slug]/ask`
