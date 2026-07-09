# ENG-021

# Platform Engineering Standards

Version 1.0

---

# PURPOSE

This document defines the mandatory engineering standards for

PropertyPilot.

These standards exist to ensure long-term maintainability,

predictability, scalability and code quality.

All contributors must follow these standards.

---

# CORE PRINCIPLES

The Digital Property Twin is the source of truth.

Knowledge is authoritative.

AI explains knowledge.

Evidence supports knowledge.

Humans approve knowledge.

Everything important is versioned.

Everything significant is auditable.

Everything expensive runs asynchronously.

Application code never bypasses platform services.

---

# ARCHITECTURE

Presentation Layer

↓

Application Services

↓

Domain Services

↓

Repositories

↓

Database

No UI component may access repositories directly.

No repository may contain business rules.

Business logic belongs in Domain Services.

---

# DEPENDENCY RULES

UI

↓

Application

↓

Domain

↓

Infrastructure

Never reverse dependencies.

No circular dependencies.

No shared mutable state.

---

# DATABASE RULES

Every table

UUID primary key

created_at

updated_at

version

Soft delete where appropriate

RLS enabled by default

Indexes documented

Repository layer required

Never expose raw SQL to UI.

---

# API RULES

REST for CRUD.

Streaming for AI.

WebSockets for live updates.

Version APIs.

Structured error responses.

Idempotent write operations where applicable.

OpenAPI documentation required.

---

# AI RULES

Never hallucinate.

Never invent property facts.

Always retrieve knowledge first.

Never answer from model memory alone.

Log every inference.

Version every prompt.

Measure every prompt.

Track every cost.

Track every latency.

---

# SECURITY

Least privilege.

Zero trust.

Organization isolation.

Signed URLs.

Parameterized queries.

Input validation.

Output encoding.

Secrets never committed.

Audit security events.

---

# PERFORMANCE

Lazy loading.

Pagination.

Virtual scrolling.

Background jobs.

Caching.

Connection pooling.

Compression.

CDN delivery.

Image optimization.

---

# TESTING

Unit tests.

Integration tests.

Repository tests.

API tests.

Workflow tests.

Permission tests.

Performance tests.

Accessibility tests.

AI evaluation tests.

Regression tests.

---

# OBSERVABILITY

Structured logging.

Distributed tracing.

Metrics.

Health checks.

Background worker monitoring.

Queue monitoring.

Database monitoring.

AI cost monitoring.

---

# FRONTEND

TypeScript only.

Strict mode enabled.

Reusable components.

Accessibility required.

Responsive layouts.

Keyboard support.

Dark mode support.

No duplicated UI logic.

---

# BACKEND

Strong typing.

Dependency injection.

Transactional boundaries.

Service-oriented design.

Explicit validation.

Immutable events.

Retry-safe processing.

---

# STORAGE

Original files preserved.

No destructive processing.

Checksums.

Versioning.

Lifecycle rules.

Cold storage support.

---

# EVENTS

Append-only.

Immutable.

Versioned.

Replayable.

Idempotent consumers.

Documented schemas.

---

# DOCUMENTATION

Every module documented.

Every service documented.

Every API documented.

Architecture diagrams maintained.

Database schema maintained.

Migration history maintained.

Decision records maintained.

---

# RELEASES

Semantic versioning.

Database migrations reversible.

Feature flags preferred.

Canary deployments supported.

Rollback procedures documented.

---

# ACCESSIBILITY

WCAG 2.2 AA target.

Keyboard accessible.

Screen reader compatible.

Captions.

Alt text.

High contrast.

Reduced motion.

---

# INTERNATIONALIZATION

Localization ready.

Translation keys.

Date localization.

Currency localization.

Unit conversion.

Time zone support.

RTL compatibility planned.

---

# CODE REVIEW

Required before merge.

Architecture review.

Security review.

Performance review.

Accessibility review.

AI prompt review.

Documentation review.

---

# SUCCESS

Every engineer should be able to understand, extend and maintain

PropertyPilot without relying on undocumented knowledge or tribal

experience.

The platform should remain understandable after ten years of

continuous development.