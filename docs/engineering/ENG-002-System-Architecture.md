# PropertyPilot

# ENG-002

# System Architecture

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the complete technical architecture of

PropertyPilot.

Every service, application, integration and deployment must

conform to this architecture.

Architecture changes require an Architecture Decision Record (ADR).

---

# HIGH LEVEL ARCHITECTURE

```

                        ┌─────────────────────────────┐

                        │        Web Browser          │

                        │    Mobile / Tablet/Desktop  │

                        └──────────────┬──────────────┘

                                       │

                                       ▼

                        ┌─────────────────────────────┐

                        │        Next.js App          │

                        │      (App Router SSR)       │

                        └──────────────┬──────────────┘

                                       │

                ┌──────────────────────┼──────────────────────┐

                ▼                      ▼                      ▼

        Authentication          Server Actions          Public API

                │                      │                      │

                └──────────────┬───────┴──────────────┬───────┘

                               ▼

                     Internal Service Layer

                               │

 ┌────────────────────────────────────────────────────────────────────┐

 │                                                                    │

 │ Property Twin Service                                               │

 │ Knowledge Engine                                                    │

 │ Voice Concierge                                                     │

 │ AI Reasoning Engine                                                 │

 │ Property Builder                                                    │

 │ Buyer Intelligence                                                  │

 │ Marketing Assets                                                    │

 │ CRM Integration                                                     │

 │ Commerce                                                            │

 │ Analytics                                                           │

 │ Notification Service                                                │

 │ Access Engine                                                       │

 │ Admin Service                                                       │

 │ Audit Service                                                       │

 │                                                                    │

 └────────────────────────────────────────────────────────────────────┘

                               │

         ┌─────────────────────┼─────────────────────┐

         ▼                     ▼                     ▼

   PostgreSQL            Supabase Storage      External Services

         │                     │                     │

         ▼                     ▼                     ▼

  Property Data         Photos / PDFs / Voice   OpenAI

                                             Stripe

                                             GoHighLevel

                                             Resend

```

---

# ARCHITECTURE PRINCIPLES

PropertyPilot follows

API First

Service Oriented

Domain Driven

Event Driven

Strong Typing

Repository Pattern

CQRS

Immutable Audit Trail

No shared mutable business logic.

---

# APPLICATION LAYERS

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

↓

External Providers

Each layer communicates only with the layer directly below.

---

# PRESENTATION LAYER

Responsibilities

Rendering

Forms

Navigation

Accessibility

Client State

Animation

Theme

Localization

Must NOT contain

Business Logic

Database Access

AI Logic

CRM Logic

Billing Logic

---

# APPLICATION LAYER

Coordinates requests.

Responsibilities

Authentication

Authorization

Validation

Transactions

Workflow orchestration

API endpoints

Server Actions

May call multiple services.

---

# DOMAIN LAYER

Contains all business rules.

Examples

Property Twin

Knowledge Engine

Lead Qualification

Marketing Assets

Buyer Intelligence

Billing Rules

CRM Sync

No UI dependencies.

No database implementation.

Pure business logic.

---

# INFRASTRUCTURE LAYER

Responsibilities

Database

Storage

Email

Payments

AI Providers

Logging

Caching

Queues

Secrets

External APIs

Replaceable implementations.

---

# DOMAIN SERVICES

The following services are independent.

Property Twin Service

Knowledge Service

Conversation Service

Voice Service

Property Builder

Marketing Engine

Buyer Intelligence

Analytics

CRM

Commerce

Notification

Audit

Access

Admin

No service accesses another service's database tables directly.

---

# PROPERTY TWIN SERVICE

Responsibilities

Create Property

Update Property

Property Health

Relationships

Timeline

Publishing

Knowledge lookup

Owns

Properties

Timeline

Property metadata

---

# KNOWLEDGE ENGINE

Responsibilities

Knowledge Objects

Facts

Relationships

Verification

Versioning

Search

Graph

Confidence

Only this service may modify verified knowledge.

---

# VOICE SERVICE

Responsibilities

Realtime Voice

Speech Recognition

Speech Synthesis

Interruptions

Streaming

Voice Settings

Conversation Events

No property knowledge stored here.

---

# AI REASONING SERVICE

Responsibilities

Prompt Assembly

Knowledge Retrieval

Conversation Memory

Response Generation

Confidence Calculation

Unknown Detection

Policy Enforcement

No persistent storage.

Stateless.

---

# PROPERTY BUILDER

Responsibilities

Photo Analysis

Document Parsing

Voice Note Parsing

Knowledge Suggestions

Timeline Extraction

Property Completeness

All extracted knowledge requires approval.

---

# BUYER INTELLIGENCE

Responsibilities

Interest Detection

Concern Detection

Lead Qualification

Conversation Summary

Intent Scoring

Recommendations

Session Analytics

---

# MARKETING ENGINE

Responsibilities

Brochures

QR Signs

PDFs

Social Media

Property Sheets

Room Cards

Marketing Copy

Asset Versioning

---

# CRM SERVICE

Responsibilities

OAuth

Synchronization

Lead Creation

Tasks

Notes

Appointments

Custom Fields

Tags

Adapters only.

---

# COMMERCE SERVICE

Responsibilities

Plans

Property Credits

Entitlements

Invoices

Billing

Stripe

Licensing

No product logic.

---

# ANALYTICS SERVICE

Responsibilities

Events

Reports

Recommendations

Benchmarks

Dashboards

Trend Analysis

No UI rendering.

---

# ACCESS ENGINE

Responsibilities

QR Resolution

Public Tokens

Visitor Sessions

Language Detection

Device Detection

Property Access

---

# NOTIFICATION SERVICE

Responsibilities

Email

Future SMS

Future Push

Reminders

Workflows

Retries

Template Rendering

---

# AUDIT SERVICE

Responsibilities

Immutable Logs

Security Events

Knowledge Changes

Admin Actions

Billing Events

CRM Events

Authentication

Append-only.

---

# ADMIN SERVICE

Responsibilities

Platform Health

Customer Management

Support Tools

Feature Flags

Monitoring

System Configuration

---

# DATABASE ARCHITECTURE

Single PostgreSQL cluster.

Logical domains.

Strict ownership.

Every table belongs to one service.

Cross-service communication occurs through APIs or events.

Never through direct SQL.

---

# EVENT BUS

Every major action emits events.

Examples

PropertyCreated

PropertyUpdated

KnowledgeApproved

KnowledgeRejected

VoiceSessionStarted

VoiceSessionEnded

LeadCaptured

BrochureGenerated

ConversationCompleted

ShowingRequested

PaymentSucceeded

PropertyPublished

Every event includes

Event ID

Timestamp

Correlation ID

Organization ID

Property ID (when applicable)

Payload

Version

Events are immutable.

---

# QUEUE ARCHITECTURE

Long-running work executes asynchronously.

Queues

Photo Processing

Voice Processing

Document Parsing

PDF Generation

CRM Sync

Email Delivery

Analytics

Retry Queue

Dead Letter Queue

Idempotency required.

---

# CACHING

Cache

Property Metadata

Knowledge Graph

Frequently Used Assets

Read Models

Never cache

Permissions

Billing

Security Decisions

Current User Roles

---

# REPOSITORY PATTERN

Every domain owns repositories.

Example

PropertyRepository

KnowledgeRepository

ConversationRepository

LeadRepository

Repositories hide database implementation.

---

# CONFIGURATION

Configuration stored in database where practical.

Examples

Voice Settings

Plans

Templates

Policies

Prompt Versions

AI Modes

Branding

No hardcoded business configuration.

---

# FILE STORAGE

Buckets

avatars

logos

photos

voice

documents

generated-assets

exports

temporary

Every object versioned.

---

# SEARCH

Central Search Service.

Supports

Knowledge

Properties

Photos

Documents

Voice Notes

Leads

Templates

Analytics

Future Elastic/OpenSearch integration supported.

---

# OBSERVABILITY

Every service reports

Latency

Errors

Health

Queue Length

Usage

Version

No silent failures.

---

# RESILIENCY

External providers isolated.

Circuit breakers.

Retries.

Timeouts.

Fallbacks.

Graceful degradation.

Platform continues functioning when possible.

---

# DEPENDENCY RULES

Presentation cannot call infrastructure.

Services cannot bypass repositories.

Repositories cannot contain business rules.

Utilities cannot depend on features.

Features cannot import other feature internals.

---

# ENGINEERING RULES

Cursor SHALL

Create services before pages.

Create repositories before services.

Create interfaces before implementations.

Generate types before business logic.

Write tests alongside implementation.

Keep services stateless whenever possible.

Use dependency injection for external providers.

Never duplicate domain models.

---

# DEFINITION OF SUCCESS

PropertyPilot's architecture must allow

New AI providers

New CRMs

New property types

New industries

New user interfaces

New integrations

without requiring a redesign of the platform.

The architecture must support years of evolution while preserving

the Digital Property Twin as the central source of truth.