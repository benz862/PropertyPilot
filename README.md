# PropertyPilot

PropertyPilot is an AI-powered Digital Property Twin platform for real estate
properties. The Digital Property Twin is the source of truth for buyer guidance,
voice capture, marketing assets, analytics, CRM sync, and property health.

## Development

```bash
npm run dev
npm run lint
npm test
npm run build
```

Validate deployment environment variables before release:

```bash
npm run validate:env
```

## Engineering Roadmap

Implementation follows `docs/engineering/ENG-022-Implementation-Roadmap.md`:

1. Foundation: authentication, organizations, properties, assets, knowledge, storage, search, UI.
2. Voice Capture: recording, transcription, extraction, review, approval.
3. AI Property Guide: buyer conversation, voice/text, retrieval, evidence, sessions.
4. Brochures: templates, PDF/HTML, branding, QR, versioning.
5. Marketing: social, email, MLS, campaign calendar, approval.
6. Buyer Intelligence: lead scores, journey replay, recommendations, health.
7. Brokerage: teams, permissions, white label, enterprise branding.
8. Advanced Platform: commercial, builder, facilities, public API, marketplace.

Every phase must remain usable and pass documentation, test, accessibility,
performance, security, audit, monitoring, rollback, and build gates.

## Key Paths

- `src/app`: Next.js App Router routes.
- `src/lib`: domain services, repositories, platform services, integrations.
- `src/components`: reusable UI, layout, feature, feedback, and navigation components.
- `src/features`: feature module boundaries for new work.
- `supabase/migrations`: database schema and policy history.
- `tests`: contracts, unit, integration, e2e, accessibility, security, AI, and fixtures.
- `docs/engineering`: locked engineering specifications.
- `docs/architecture`: ADRs and runbooks.
