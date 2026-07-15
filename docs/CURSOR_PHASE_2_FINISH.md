# CURSOR_PHASE_2_[FINISH.md](http://FINISH.md)

## Objective

Finish PropertyPilot.

Do NOT add new major features.

Do NOT redesign the UI.

Do NOT change the workflow.

The goal is to eliminate duplicate systems and wire the new engines into production.

---

# Priority 1

Replace legacy code with the new engine architecture.

Specifically:

- Replace the live QR question flow with QuestionAnsweringService.

- Replace legacy publishing with PublishingService.

- Replace legacy recommendation logic with RecommendationService.

- Remove duplicate code paths where possible.

There should only be one implementation of each responsibility.

---

# Priority 2

Property DNA becomes authoritative.

Everything must read from Property DNA.

Implement:

POST /api/properties/[id]/dna/rebuild

When called:

- rebuild Property DNA

- update health

- refresh recommendations

- mark generated assets needing regeneration

Property DNA becomes the source of truth.

---

# Priority 3

Complete Buyer Activity.

Record:

- page_open

- qr_scan

- room_selected

- question_asked

- unknown_question

- answer_returned

- lead_submitted

- asset_downloaded

- session_started

- session_ended

Every buyer interaction should be recorded.

---

# Priority 4

Complete Property Studio.

Generate actual downloadable files.

Implement:

- Buyer Brochure PDF

- Feature Sheet PDF

- Open House Flyer PDF

- QR Sign PDF

- QR PNG

- Voice scripts as Markdown

Asset cards should show:

- Preview

- Download

- Regenerate

- Last Generated

---

# Priority 5

Overview improvements.

Add:

Recent Buyer Questions card.

Recent Recommendations card.

Property Health card.

Most Asked Topic.

Last Generated Asset.

Keep the page clean.

---

# Priority 6

Recommendation Engine

Improve recommendations.

Examples:

Repeated roof questions

Repeated school questions

Repeated tax questions

Missing room notes

Missing utilities

Weak room coverage

Missing brochure

No QR signs

No FAQ

No Neighborhood Guide

Recommendations should become increasingly useful.

---

# Priority 7

GoHighLevel

Finish integration.

Implement:

- Contact Sync

- Notes

- Tags

- Tasks

- Opportunity (optional)

Failures must never affect buyer experience.

---

# Priority 8

Property Studio

Finish these categories.

Print

- Buyer Brochure

- Feature Sheet

- Flyer

Digital

- Website

- QR Tour

Voice

- Greetings

- Voice KB

Marketing

- MLS

- Luxury

- Family

- Investor

Buyer

- FAQ

- Showing Notes

- Neighborhood Guide

Social

- Facebook

- Instagram

- LinkedIn

Email

- Just Listed

- Open House

- Price Reduction

---

# Cleanup

Remove dead code.

Remove duplicate services.

Remove unused components.

Remove placeholder logic.

Remove obsolete routes.

Document every public service.

---

# Verification

Before completion:

npm run lint

npm test

npm run build

All must pass.

Then produce one report:

- Completed

- Remaining

- Known limitations

- Recommended next phase