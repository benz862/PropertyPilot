# ADR-009: Managed Prompt Library

Status: Accepted

Date: 2026-07-09

## Context

AI prompts affect buyer-facing answers, marketing copy, knowledge extraction, safety, latency, cost, and compliance.

## Decision

Production prompts are stored, versioned, evaluated, and audited as managed prompt templates.

## Alternatives Considered

- Hardcode prompts in application modules
- Keep prompts in unstructured markdown files

## Pros

- Prompt rollback is possible
- AI behavior is traceable and reproducible
- Prompt testing and approval can become release gates

## Cons

- Requires prompt migration and management workflow
- Runtime prompt loading needs fallback behavior for local development

## Consequences

AI executions must record prompt key, prompt version, policy version, model, token usage, latency, and fallback state.

## Related Documents

- ENG-008
- ENG-012
- ENG-013
