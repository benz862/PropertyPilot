# ADR-001: Digital Property Twin Is The Single Source Of Truth

Status: Accepted

Date: 2026-07-09

## Context

Property information originates from voice notes, photographs, documents, MLS data, manual entry, and integrations.

## Decision

Every verified property fact exists in the Digital Property Twin. AI responses, brochures, QR experiences, reports, and recommendations retrieve property information from the twin.

## Alternatives Considered

- Store separate copies per workflow
- Let each feature maintain its own property facts

## Pros

- One canonical source for property knowledge
- Lower hallucination and inconsistency risk
- Easier auditing and versioning

## Cons

- Features must depend on the twin service and repositories
- Migration work is required for legacy feature-specific data

## Consequences

All property-facing features must use services that read from or write to the Digital Property Twin rather than duplicating factual property data.

## Related Documents

- ENG-001
- ENG-012
- ENG-020
- PRD-004
