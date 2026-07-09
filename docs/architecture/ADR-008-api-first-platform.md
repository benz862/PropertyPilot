# ADR-008: API-First Platform

Status: Accepted

Date: 2026-07-09

## Context

PropertyPilot needs to support the web app, future mobile apps, integrations, enterprise customers, and automation.

## Decision

Every capability must exist through a versioned API before it is exposed through the user interface.

## Alternatives Considered

- UI-first implementation
- Direct component-to-database workflows

## Pros

- Stable integration surface
- Better testability
- Future clients can reuse platform capabilities

## Cons

- Requires API contract maintenance
- Adds upfront implementation discipline

## Consequences

New workflows need route handlers, typed contracts, validation, authorization, and standard response envelopes.

## Related Documents

- ENG-004
- ENG-012
