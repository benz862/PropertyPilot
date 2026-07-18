# PropertyPilot Cursor Build Spec
## Make the AI Operating System for Residential Real Estate Real

---

## Product North Star

PropertyPilot is not a CRM, brochure generator, website builder, or QR-code tool.

PropertyPilot is the **AI Operating System for a residential real estate listing**.

The product must help a Realtor:

1. Understand a property faster.
2. Generate every marketing and buyer-facing asset from one source of truth.
3. Let buyers scan QR codes and ask room-specific questions.
4. Capture leads and buyer intent.
5. Recommend what the agent should improve next.
6. Sync important buyer/lead activity into GoHighLevel when configured.

The core principle:

> Build engines, not isolated pages.

Everything should feed or read from one central intelligence object called:

# Property DNA

---

## Hard Scope Control

Do not build the entire dream at once.

The immediate goal is a working, impressive MVP around the original concept:

> A buyer walks into a house, scans a QR code, selects the room they are standing in, asks a voice or text question, and gets a grounded answer based on the property.

Everything else should support that.

---

# Phase 1 — Immediate MVP

## Objective

Create a working PropertyPilot experience where:

### Admin can:

- Create a property.
- Add/edit room knowledge.
- Upload or paste property notes.
- Generate core assets.
- Publish a public QR tour.
- Download QR signs.
- Review buyer questions and leads.

### Buyer can:

- Scan a QR code.
- Open a mobile public property page.
- Choose a room.
- Ask a typed or voice question.
- Receive an AI answer based only on Property DNA.
- Submit contact info if the AI does not know the answer.

---

# Engine 1 — Property DNA

Create a central normalized data model that all other features use.

Do not allow each feature to independently parse MLS, documents, photos, or voice notes.

Everything must write to or read from Property DNA.

## Suggested TypeScript Shape

```ts
export type PropertyDNA = {
  propertyId: string

  basic: {
    address?: string
    price?: number
    beds?: number
    baths?: number
    squareFeet?: number
    lotSize?: string
    yearBuilt?: number
    propertyType?: string
    construction?: string
    mlsDescription?: string
    summary?: string
  }

  rooms: Array<{
    id: string
    name: string
    description?: string
    features: string[]
    upgrades: string[]
    includedItems: string[]
    cautions: string[]
    buyerTalkingPoints: string[]
    sourceRefs: SourceRef[]
  }>

  systems: {
    roof?: Fact
    hvac?: Fact
    electrical?: Fact
    plumbing?: Fact
    waterHeater?: Fact
    sewer?: Fact
    water?: Fact
    internet?: Fact
    naturalGas?: Fact
  }

  exterior: {
    features: Fact[]
    lotFeatures: Fact[]
    garage?: Fact
    pool?: Fact
    patioDeck?: Fact
    landscaping?: Fact
  }

  neighborhood: {
    schools?: Fact[]
    shopping?: Fact[]
    restaurants?: Fact[]
    parks?: Fact[]
    commute?: Fact[]
    notes?: Fact[]
  }

  documents: Array<{
    id: string
    filename: string
    storagePath?: string
    documentType?: string
    extractedText?: string
    summary?: string
    sourceRefs: SourceRef[]
  }>

  voiceNotes: Array<{
    id: string
    transcript: string
    extractedFacts: Fact[]
    sourceRefs: SourceRef[]
  }>

  photos: Array<{
    id: string
    filename: string
    storagePath?: string
    roomName?: string
    caption?: string
    visibleFeatures: string[]
    sourceRefs: SourceRef[]
  }>

  buyerQuestions: Array<{
    id: string
    selectedRoom?: string
    question: string
    answer?: string
    needsAgentFollowup: boolean
    createdAt: string
  }>

  health: {
    knowledgeScore: number
    marketingScore: number
    buyerReadinessScore: number
    missingInformation: string[]
    recommendations: string[]
  }

  generatedAssets: Array<{
    id: string
    type: GeneratedAssetType
    title: string
    content?: string
    fileUrl?: string
    lastGeneratedAt?: string
  }>
}

export type Fact = {
  label: string
  value: string
  confidence: "high" | "medium" | "low"
  sourceRefs: SourceRef[]
}

export type SourceRef = {
  sourceType: "manual" | "mls" | "document" | "photo" | "voice_note" | "buyer_question" | "system"
  sourceId?: string
  label?: string
}

export type GeneratedAssetType =
  | "buyer_brochure"
  | "luxury_brochure"
  | "feature_sheet"
  | "open_house_flyer"
  | "property_description"
  | "luxury_description"
  | "mls_description"
  | "qr_sign"
  | "voice_intro"
  | "voice_agent_knowledge_base"
  | "buyer_faq"
  | "showing_notes"
  | "neighborhood_guide"
  | "moving_guide"
  | "utility_guide"
```

---

# Engine 2 — Property Q&A Engine

Create a service that answers buyer questions using Property DNA only.

## Service

```ts
answerPropertyQuestion({
  propertyDNA,
  selectedRoom,
  question,
  inputType
})
```

## Rules

1. Use selected-room knowledge first.
2. Use whole-property knowledge second.
3. Do not invent missing details.
4. If unknown, say it is not available yet and offer to send the question to the agent.
5. Keep answers concise enough for voice playback.
6. Flag legal, inspection, school, tax, HOA, or disclosure-sensitive topics as needing agent/official verification.
7. Return source references where possible.
8. Log every question.

## Response Shape

```ts
{
  answer: string
  confidence: "high" | "medium" | "low"
  needsAgentFollowup: boolean
  sourceRefs: SourceRef[]
  questionId: string
}
```

---

# Engine 3 — QR Room Tour

This is the flagship MVP.

## Public Route

```txt
/p/[slug]
```

Optional room deep link:

```txt
/p/[slug]?room=kitchen
```

## Buyer Page Requirements

Mobile-first.

Show:

- Hero image.
- Address.
- Short summary.
- Room chips.
- Ask text field.
- Microphone button where supported.
- Answer card.
- “Send this question to the agent” lead form.
- Agent contact card.
- Required disclaimer.

## Rooms

Default room options:

- Whole Property
- Kitchen
- Living Room
- Primary Bedroom
- Bathroom
- Basement
- Garage
- Backyard
- Exterior
- Neighborhood

Allow admin to customize rooms.

## Voice

Use browser-native speech features for MVP.

- Speech-to-text: Web Speech API where supported.
- Text-to-speech: `window.speechSynthesis`.
- Typed input must always work.
- Do not autoplay audio.
- User must tap to speak or listen.

---

# Engine 4 — Generated Assets Studio

Replace any basic “Generated Assets” page with a real publishing studio.

Do not make this only a download list.

Organize assets into categories.

## Required MVP Assets

### 1. Feature Sheet

One-page PDF.

Purpose:

Fast, factual handout for buyers.

Include:

- Address.
- Price.
- Beds.
- Baths.
- Square footage.
- Lot size.
- Year built.
- Top features.
- Major updates.
- Room highlights.
- QR code.
- Agent contact.
- Disclaimer.

### 2. Buyer Brochure

Multi-page PDF, but MVP can be 4 pages.

Purpose:

Polished buyer-facing brochure.

Include:

- Cover page.
- Property story.
- Room highlights.
- Features/upgrades.
- Neighborhood notes.
- QR code.
- Agent contact.
- Disclaimer.

### 3. Open House Flyer

One-page PDF.

Purpose:

Open house promotion and handout.

Include:

- Hero image.
- 5 strongest selling points.
- Open house date/time if provided.
- QR code.
- Agent contact.

### 4. Property Description

Generate multiple text versions:

- MLS version.
- Short version.
- Long website version.
- Luxury version.

### 5. QR Sign

PDF and PNG.

Generate signs for:

- Whole Property.
- Each room.

Each sign should include:

- Clear heading.
- QR code.
- Short instruction.

Example:

“Scan to ask questions about this kitchen.”

### 6. Voice Introductions

Generate voice agent scripts:

- General greeting.
- Room-specific greeting.
- Open house greeting.
- Unknown-answer fallback.
- Lead-capture prompt.

### 7. Buyer FAQ

Generated from Property DNA.

Grouped by:

- Property.
- Rooms.
- Utilities.
- Neighborhood.
- Showing/offer process.

### 8. Showing Notes

Printable agent-facing notes.

Include:

- Best talking points.
- Sensitive unknowns.
- Buyer questions to expect.
- Items agent should verify.

---

# Asset Generation Rules

All assets must be generated from Property DNA.

Do not generate unsupported claims.

If information is missing, omit it or mark it as unknown internally.

Each asset should have a regeneration button.

Each asset should show:

- Status: Not generated / Generated / Needs refresh.
- Last generated timestamp.
- Source: Property DNA version or updated_at timestamp.

---

# Engine 5 — Property Health and Decision Engine

Create a basic health/recommendation system.

## Scores

Show on property overview:

- Knowledge Score.
- Marketing Score.
- Buyer Readiness Score.

## Missing Information Examples

- Roof age missing.
- HVAC age missing.
- Utility costs missing.
- HOA details missing.
- Internet provider missing.
- Pool age/details missing.
- Water/sewer details missing.
- Appliance inclusion unclear.
- Room notes missing.
- No QR tour published.

## Recommendations

Examples:

- “Add roof age. Buyers often ask about roof condition.”
- “Generate room QR signs before showings.”
- “Add utility cost information for relocation buyers.”
- “Kitchen has strong features. Lead with it in marketing copy.”
- “The AI could not answer 3 buyer questions. Review and update Property DNA.”

The Decision Engine should not be complicated yet. Rule-based is acceptable for MVP.

---

# Engine 6 — Buyer Intelligence

For MVP, store behavior first. Analyze later.

Track:

- QR scan/open.
- Room selected.
- Question asked.
- Answer given.
- Unknown question.
- Lead submitted.
- Asset downloaded if implemented.
- Timestamp.
- User agent.
- Referrer if available.

Create a simple admin page:

## Buyer Activity

Show:

- Recent questions.
- Selected room.
- AI answer.
- Follow-up needed.
- Buyer contact if submitted.
- Date/time.

No complex dashboards yet.

---

# Engine 7 — GoHighLevel Integration

Do not pretend GHL is integrated unless it actually is.

Add a settings page for GHL integration.

## GHL MVP Integration Goals

When configured, PropertyPilot should:

1. Create or update a GHL contact when a buyer submits contact information.
2. Add tags based on property and source.
3. Add a note with the buyer’s question and AI answer.
4. Optionally create a task when the AI cannot answer.
5. Prepare structure for future calendar booking.

## GHL Settings Page

Fields:

- GHL API key or access token.
- Location ID.
- Default pipeline ID optional.
- Default calendar ID optional.
- Enable contact sync toggle.
- Enable task creation toggle.
- Test connection button.

## Important

PropertyPilot does not replace GHL.

PropertyPilot owns:

- Property DNA.
- AI Q&A.
- QR tour.
- Generated assets.
- Buyer intelligence.

GHL owns:

- CRM contacts.
- Calendar.
- Pipelines.
- Workflows.
- Email.
- SMS.
- Tasks.

## GHL Sync Events

When buyer lead is submitted:

- Create/update contact.
- Add tags:
  - PropertyPilot
  - QR Tour
  - Property: [address or slug]
  - Room: [selected room]

Add note:

```txt
PropertyPilot QR Tour Lead

Property: [address]
Room: [selectedRoom]
Question: [question]
AI Answer: [answer]
Needs follow-up: [true/false]
```

If `needsAgentFollowup` is true:

- Create task:
  - Title: Answer PropertyPilot buyer question
  - Body: include property, room, question, buyer contact.

If GHL fails:

- Do not break buyer experience.
- Save local lead.
- Mark `ghl_sync_status = failed`.
- Store error message.
- Allow retry from admin.

---

# Database Additions

Add or verify the following tables.

## property_dna_snapshots

Stores normalized DNA snapshots or extracted intelligence.

```sql
id uuid primary key
property_id uuid not null
dna jsonb not null
version integer not null default 1
created_at timestamptz default now()
updated_at timestamptz default now()
```

## property_rooms

```sql
id uuid primary key
property_id uuid not null
name text not null
description text
features jsonb default '[]'
upgrades jsonb default '[]'
included_items jsonb default '[]'
cautions jsonb default '[]'
buyer_talking_points jsonb default '[]'
created_at timestamptz default now()
updated_at timestamptz default now()
```

## buyer_questions

```sql
id uuid primary key
property_id uuid not null
room_id uuid
selected_room text
question text not null
answer text
confidence text
needs_agent_followup boolean default false
source_refs jsonb default '[]'
input_type text default 'text'
buyer_name text
buyer_email text
buyer_phone text
ghl_sync_status text default 'not_synced'
ghl_contact_id text
ghl_error text
created_at timestamptz default now()
```

## buyer_events

```sql
id uuid primary key
property_id uuid not null
event_type text not null
room_id uuid
selected_room text
metadata jsonb default '{}'
created_at timestamptz default now()
```

## generated_assets

```sql
id uuid primary key
property_id uuid not null
asset_type text not null
title text not null
content text
file_url text
status text default 'draft'
source_dna_version integer
created_at timestamptz default now()
updated_at timestamptz default now()
```

## ghl_integrations

```sql
id uuid primary key
user_id uuid not null
location_id text
api_key_encrypted text
contact_sync_enabled boolean default true
task_creation_enabled boolean default true
default_calendar_id text
default_pipeline_id text
created_at timestamptz default now()
updated_at timestamptz default now()
```

---

# API Routes

## Public

```txt
GET /api/public/properties/[slug]
POST /api/public/properties/[slug]/ask
POST /api/public/questions/[questionId]/lead
POST /api/public/properties/[slug]/event
```

## Admin

```txt
GET /api/properties/[id]/dna
POST /api/properties/[id]/dna/rebuild

GET /api/properties/[id]/rooms
POST /api/properties/[id]/rooms
PATCH /api/properties/[id]/rooms/[roomId]
DELETE /api/properties/[id]/rooms/[roomId]

GET /api/properties/[id]/generated-assets
POST /api/properties/[id]/generated-assets/generate
POST /api/properties/[id]/generated-assets/[assetId]/regenerate

GET /api/properties/[id]/buyer-activity
GET /api/properties/[id]/health

GET /api/properties/[id]/qr
POST /api/properties/[id]/qr/generate

GET /api/settings/ghl
POST /api/settings/ghl
POST /api/settings/ghl/test
POST /api/settings/ghl/retry-sync
```

---

# UI Pages To Build or Update

## Admin

### `/dashboard`

Should show recommendations, not just empty stats.

### `/properties`

Property list.

### `/properties/[id]`

Property Mission Control.

Top cards:

- Knowledge Score.
- Marketing Score.
- Buyer Readiness.
- QR Tour status.
- Recent buyer questions.

Tabs:

- Overview.
- Property DNA.
- Rooms.
- Generated Assets.
- QR Tour.
- Buyer Activity.
- Documents.
- Voice Notes.
- Settings.

### `/properties/[id]/generated-assets`

Property Studio.

Grouped asset cards.

Each card:

- Generate button.
- Preview button.
- Download/copy button.
- Regenerate button.
- Last updated.
- Needs refresh indicator.

### `/properties/[id]/qr-tour`

Admin QR tour controls.

Show:

- Public URL.
- Copy URL.
- Download whole-property QR.
- Download room QR signs.
- Publish/unpublish.
- Preview public page.

### `/properties/[id]/buyer-activity`

Show questions/leads/events.

### `/settings/ghl`

GHL integration settings.

---

## Public

### `/p/[slug]`

Mobile QR buyer tour.

Must be fast, clean, and not look like an admin page.

---

# Design Direction

PropertyPilot should feel premium and calm.

Avoid clutter.

Avoid generic SaaS emptiness.

Every empty state should teach the user what to do next.

Use language like:

- “Build Everything”
- “Property DNA”
- “Buyer Activity”
- “QR Tour”
- “Generated Assets”
- “Needs Attention”

Avoid vague labels like:

- “Data”
- “Files”
- “Items”
- “Resources”

---

# Disclaimers

Public buyer page should include:

```txt
PropertyPilot provides AI-generated answers based on information supplied for this property. Details should be verified with the listing agent, disclosures, inspections, MLS data, and official records before making decisions.
```

Generated assets should include:

```txt
Information is believed to be accurate but should be independently verified. Buyer should confirm all property details, measurements, taxes, schools, utilities, HOA rules, and condition through appropriate professionals and official sources.
```

---

# Testing Requirements

Add or update tests for:

- Property DNA creation.
- Property DNA rebuild.
- Room creation/editing.
- Public property fetch.
- Public unpublished property blocked.
- Room-specific Q&A.
- Whole-property Q&A.
- Unknown answer triggers follow-up.
- Buyer lead saved.
- Buyer event logged.
- Feature sheet generation.
- QR sign generation.
- Voice intro generation.
- GHL sync success.
- GHL sync failure does not break local lead.
- Health score detects missing roof/HVAC/utility data.

Run:

```bash
npm run lint
npm test
npm run build
```

---

# Non-MVP

Do not build these yet unless the foundation is complete:

- Full AI photo vision intelligence.
- Deep PDF extraction.
- Twilio phone agent.
- ElevenLabs voice.
- Full marketing automation.
- Advanced buyer intent scoring.
- Brokerage analytics.
- Billing/subscriptions.
- Multi-agent permissions.
- Complex GHL calendar booking.

The MVP must work first.

---

# Definition of Done

This phase is complete when:

## Admin can:

1. Create or open a property.
2. Add room-specific knowledge.
3. Build/rebuild Property DNA.
4. Generate feature sheet, buyer brochure, open house flyer, QR signs, property descriptions, FAQ, showing notes, and voice introductions.
5. Publish QR tour.
6. Download or copy QR assets.
7. Review buyer questions and leads.
8. Configure basic GHL sync.

## Buyer can:

1. Scan QR code.
2. Open public mobile page.
3. Select room.
4. Ask text or voice question.
5. Receive grounded answer from Property DNA.
6. Submit contact info if needed.
7. Trigger local lead capture and optional GHL sync.

## System must:

1. Avoid hallucinated property claims.
2. Preserve source references where available.
3. Store every buyer question.
4. Handle GHL failures safely.
5. Keep existing wizard flow intact.
6. Pass lint, tests, and build.

---

# Final Instruction

Build this as an engine-based system.

Do not create disconnected features.

Every new feature must either:

1. Feed Property DNA.
2. Read from Property DNA.
3. Improve buyer experience.
4. Improve agent decision-making.
5. Sync useful activity to GHL.

If it does none of those, do not build it now.
