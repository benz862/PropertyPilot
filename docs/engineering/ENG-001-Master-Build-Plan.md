# PropertyPilot

# ENG-001

# Master Build Plan

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

Last Updated: July 2026

---

# PURPOSE

This document is the authoritative engineering guide for building

PropertyPilot.

Every engineer, AI coding assistant, contractor and contributor

MUST read this document before writing code.

If this document conflicts with another engineering document,

ENG-001 takes precedence.

If this document conflicts with a Product Requirement Document,

the conflict must be documented before implementation proceeds.

---

# PRODUCT SUMMARY

PropertyPilot is an AI-powered Digital Property Intelligence Platform.

The platform creates a Digital Property Twin for every property and

uses that Digital Property Twin as the single source of truth for:

• AI Voice Concierge

• Buyer Intelligence

• Marketing Assets

• CRM Integration

• Property Analytics

• Seller Intelligence

• QR Property Experiences

The QR experience is NOT the product.

The Digital Property Twin IS the product.

---

# TECHNOLOGY STACK (LOCKED)

Frontend

Next.js (App Router)

React

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

React Hook Form

Zod

Backend

Supabase

PostgreSQL

Storage

Authentication

Realtime

Edge Functions

AI

OpenAI Realtime API

OpenAI Responses API

Vision

Embeddings

Infrastructure

Vercel

GitHub

Stripe

Resend

GoHighLevel

Future integrations must not replace these without an Architecture

Decision Record.

---

# REPOSITORY STRUCTURE

/app

/components

/features

/services

/lib

/hooks

/types

/utils

/styles

/public

/supabase

/tests

/docs

/docs/prd

/docs/engineering

/docs/architecture

/scripts

---

# FEATURE ORGANIZATION

Every major feature exists inside /features.

Example

/features/property

/features/voice

/features/knowledge

/features/analytics

/features/crm

/features/billing

/features/property-builder

/features/marketing

/features/admin

No feature may directly access another feature's internals.

Communication occurs through services.

---

# SERVICE LAYER

Every feature contains

api

components

hooks

schemas

services

types

utils

Business logic belongs ONLY inside services.

Never inside React components.

---

# DATABASE ACCESS

React Components

↓

Server Actions

↓

Service Layer

↓

Repository Layer

↓

Supabase

Components NEVER query Supabase directly.

---

# ARCHITECTURE PRINCIPLES

The Digital Property Twin is the single source of truth.

Everything is versioned.

Everything is audited.

Everything is typed.

Everything is testable.

Everything is modular.

Everything is replaceable.

---

# CODING PRINCIPLES

Cursor SHALL

Write readable code.

Prefer composition over inheritance.

Avoid duplication.

Prefer small functions.

Use descriptive names.

Never use magic strings.

Never hardcode IDs.

Never hardcode secrets.

Never hardcode pricing.

Never hardcode AI prompts.

Use dependency injection where appropriate.

---

# TYPESCRIPT RULES

Strict Mode enabled.

No implicit any.

Interfaces before implementation.

Shared interfaces stored centrally.

Enums only when appropriate.

Prefer union types.

Never disable compiler warnings.

---

# REACT RULES

Functional Components only.

Server Components by default.

Client Components only when required.

Memoization only when measurable.

No deeply nested component trees.

Maximum component length

300 lines

Maximum function length

75 lines

Refactor beyond limits.

---

# STYLING RULES

Tailwind only.

No inline styles.

No CSS modules.

No duplicated utility classes.

Use design tokens.

Responsive by default.

Dark mode supported.

Accessibility required.

---

# FORM RULES

React Hook Form

Zod Validation

Server Validation

Optimistic UI where appropriate.

Autosave where appropriate.

---

# FILE NAMING

PascalCase

Components

PropertyCard.tsx

camelCase

Utilities

formatPrice.ts

kebab-case

Folders

property-builder

---

# API RULES

REST

Versioned

/api/v1/

Every endpoint documented.

Every endpoint authenticated.

Every response typed.

---

# ERROR HANDLING

Never expose stack traces.

User-friendly messages.

Structured logging.

Retry where appropriate.

Errors always include

Correlation ID

Timestamp

Context

---

# LOGGING

Every important action logged.

Property Creation

Voice Session

Knowledge Update

Lead Creation

CRM Sync

Billing

Authentication

Publishing

---

# VERSION CONTROL

GitHub Flow

main

Protected

develop

Optional

feature/*

bugfix/*

hotfix/*

Release Tags

Semantic Versioning

---

# BRANCH RULES

One feature

One branch

One pull request

Small commits

Clear descriptions

---

# DEFINITION OF DONE

A feature is complete only if

Requirements implemented

Unit tests pass

Integration tests pass

Accessibility reviewed

Security reviewed

Documentation updated

No lint warnings

No TypeScript errors

Performance reviewed

Approved

---

# SECURITY RULES

Never expose secrets.

Never bypass authorization.

Never disable RLS.

Never trust client data.

Sanitize input.

Validate output.

Escape user content.

---

# AI RULES

AI never guesses.

AI never fabricates.

AI always references verified knowledge.

AI admits uncertainty.

Unknown questions become Knowledge Gaps.

AI prompts stored separately.

AI providers replaceable.

---

# DATABASE RULES

UUID primary keys.

Soft deletes.

Audit timestamps.

Foreign keys enforced.

Indexes reviewed.

Migrations versioned.

Row Level Security enabled.

---

# PERFORMANCE TARGETS

Dashboard

<2 sec

Property Load

<2 sec

Voice Startup

<1 sec

Conversation Response

<2 sec

Search

<500 ms

Brochure Generation

<30 sec

---

# ACCESSIBILITY

WCAG AA minimum.

Keyboard support.

Screen readers.

Caption support.

Large touch targets.

Accessible forms.

---

# TESTING

Unit

Integration

End-to-End

AI Evaluation

Security

Performance

Accessibility

Regression

Every feature includes tests.

---

# BUILD PHASES

Phase 1

Foundation

Authentication

Navigation

Design System

Database

Users

Phase 2

Digital Property Twin

Knowledge Engine

Photos

Voice Notes

Documents

Timeline

Phase 3

AI Platform

Reasoning

Realtime Voice

Conversation

Property Builder

Phase 4

Buyer Experience

QR

Tour

Brochures

Lead Capture

Phase 5

Business Platform

CRM

Analytics

Marketing

Billing

Reporting

Phase 6

Enterprise

Organizations

Teams

Marketplace

API

Administration

Phase 7

Production

Security

Monitoring

Optimization

Launch

---

# NON-NEGOTIABLE PRINCIPLES

1.

Digital Property Twin is the source of truth.

2.

Business logic never lives inside UI.

3.

Everything important is versioned.

4.

Everything important is audited.

5.

Every feature is API-first.

6.

Every service is independently testable.

7.

No duplicate business logic.

8.

No direct database calls from components.

9.

No AI-generated facts become verified automatically.

10.

Every recommendation must explain why.

---

# CURSOR IMPLEMENTATION RULES

Cursor SHALL

Read this document before implementing features.

Read only the engineering documents required for the current task.

Never redesign architecture without an ADR.

Never replace approved technologies.

Never ignore TypeScript errors.

Never suppress lint errors.

Never disable tests to achieve a passing build.

Never introduce duplicate implementations.

Always prefer extending existing services over creating parallel ones.

Always update documentation when introducing new functionality.

Always create reusable code before specialized code.

Always assume PropertyPilot is being built for long-term commercial use.

---

# SUCCESS

PropertyPilot should be engineered so that adding the next feature

requires extending the architecture—not rewriting it.

Every engineering decision should increase maintainability,

testability, scalability and customer trust.

This document is the engineering constitution of PropertyPilot.