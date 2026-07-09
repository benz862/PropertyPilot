# PropertyPilot

# ENG-012

# Architecture Decision Records (ADR)

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document records every significant architectural decision

made during the development of PropertyPilot.

An Architecture Decision Record (ADR) documents

• The problem

• The decision

• The alternatives considered

• The tradeoffs

• The consequences

Every major architectural change requires a new ADR.

Once accepted, ADRs become part of the permanent engineering history.

---

# ADR TEMPLATE

```

ADR-XXX

Title

Status

Accepted

Proposed

Superseded

Deprecated

Date

Context

Decision

Alternatives Considered

Pros

Cons

Consequences

Related Documents

Superseded By (if applicable)

```

---

###############################################################

ADR-001

###############################################################

Title

Digital Property Twin is the Single Source of Truth

Status

Accepted

Context

Property information originates from many sources including voice

notes, photographs, documents, MLS data and manual entry.

Decision

Every verified property fact shall exist only inside the Digital

Property Twin.

Every AI response, brochure, QR experience and report must retrieve

information from the Digital Property Twin.

Consequences

Single source of truth

No duplicate property facts

Simplified maintenance

---

###############################################################

ADR-002

###############################################################

Title

Voice-First Buyer Experience

Status

Accepted

Context

Traditional QR experiences are passive.

Decision

Every public property experience begins with voice.

Text supports voice.

Voice does not support text.

Consequences

Differentiation

Higher engagement

Natural conversations

---

###############################################################

ADR-003

###############################################################

Title

Single QR Code Per Property

Status

Accepted

Context

Early concepts proposed one QR code for every room.

Decision

One QR code launches the complete PropertyPilot experience.

Visitors select

Room

Area

Feature

Topic

The AI maintains conversation context.

Consequences

Simpler setup

Lower printing costs

Cleaner branding

Better analytics

---

###############################################################

ADR-004

###############################################################

Title

Knowledge Objects Replace Room-Based Storage

Status

Accepted

Context

Rooms alone cannot model every property.

Decision

Information is stored as Knowledge Objects.

Examples

Kitchen

Roof

Pool

HVAC

Garage

Workshop

Solar System

Landscape

Detached Building

Neighborhood

Consequences

Unlimited flexibility

Commercial support

Future verticals

---

###############################################################

ADR-005

###############################################################

Title

Verified Facts Override AI Generation

Status

Accepted

Decision

AI never invents property facts.

Verified knowledge always takes precedence.

Unknown answers remain unknown.

Consequences

Greater trust

Reduced hallucinations

Improved compliance

---

###############################################################

ADR-006

###############################################################

Title

Property Builder is the Core Workspace

Status

Accepted

Decision

The Property Builder becomes the primary application experience.

Analytics

Marketing

CRM

Reporting

surround the Builder.

Consequences

Focus remains on improving the Digital Property Twin.

---

###############################################################

ADR-007

###############################################################

Title

Service-Oriented Architecture

Status

Accepted

Decision

Business capabilities are implemented as services.

Examples

Knowledge

Voice

Analytics

Marketing

CRM

Billing

Repositories isolate persistence.

Consequences

Independent testing

Future scalability

Provider replacement

---

###############################################################

ADR-008

###############################################################

Title

API-First Platform

Status

Accepted

Decision

Every capability must exist through an API before being exposed

through the user interface.

Consequences

Future mobile apps

Partner integrations

Public API

Automation

---

###############################################################

ADR-009

###############################################################

Title

Prompt Library Managed Outside Application Code

Status

Accepted

Decision

AI prompts are stored, versioned and managed separately from the

application.

Consequences

Version control

Prompt rollback

Model independence

A/B testing

---

###############################################################

ADR-010

###############################################################

Title

AI Orchestrator Service

Status

Accepted

Decision

All AI requests flow through a centralized orchestration layer.

Responsibilities

Prompt selection

Knowledge retrieval

Model routing

Safety

Validation

Logging

Cost tracking

Consequences

Central governance

Simpler maintenance

Consistent AI behavior

---

###############################################################

ADR-011

###############################################################

Title

Buyer Intelligence is a First-Class Feature

Status

Accepted

Decision

Conversation analytics become a core platform capability rather

than an add-on.

Track

Interest

Concerns

Intent

Questions

Engagement

Follow-up recommendations

Consequences

Higher value for agents

Differentiated product

---

###############################################################

ADR-012

###############################################################

Title

Enterprise-Ready From Day One

Status

Accepted

Decision

Organizations, offices and teams are part of the initial data

model.

No future migration required.

Consequences

Scalable architecture

Enterprise sales readiness

---

###############################################################

ADR-013

###############################################################

Title

OpenAI as Initial AI Provider

Status

Accepted

Decision

OpenAI is the initial provider.

Provider abstraction allows future support for

Anthropic

Google

Azure OpenAI

Local models

without changing application logic.

---

###############################################################

ADR-014

###############################################################

Title

Supabase as Backend Platform

Status

Accepted

Decision

Supabase provides

Authentication

PostgreSQL

Storage

Realtime

Edge Functions

Consequences

Rapid development

Managed infrastructure

Future portability through repository pattern

---

###############################################################

ADR-015

###############################################################

Title

GoHighLevel as Initial CRM

Status

Accepted

Decision

Native integration targets GoHighLevel first.

CRM adapters allow future support for

Salesforce

HubSpot

Follow Up Boss

kvCORE

Others

without changing business logic.

---

###############################################################

ADR-016

###############################################################

Title

Marketing Assets Generated from the Digital Property Twin

Status

Accepted

Decision

Brochures

QR signs

Social media

Property sheets

Email copy

All generated from verified knowledge.

No duplicated content entry.

Consequences

Consistency

Accuracy

Reduced work

---

###############################################################

ADR-017

###############################################################

Title

Every Recommendation Must Explain Why

Status

Accepted

Decision

Whenever PropertyPilot scores, recommends or prioritizes

something, it stores

Evidence

Confidence

Reasoning summary

Source data

Consequences

Transparency

Supportability

Trust

---

###############################################################

ADR-018

###############################################################

Title

Security by Design

Status

Accepted

Decision

Security requirements are part of every feature.

Never added later.

Includes

RLS

Encryption

Audit

Least privilege

Immutable logs

---

###############################################################

ADR-019

###############################################################

Title

Feature Flags Required

Status

Accepted

Decision

Every significant feature ships behind a feature flag.

Supports

Internal

Pilot

Beta

Enterprise

Production

Emergency rollback

---

###############################################################

ADR-020

###############################################################

Title

Long-Term Vision Beyond Residential Real Estate

Status

Accepted

Decision

The architecture supports additional industries.

Examples

Commercial

Hotels

Museums

Universities

Healthcare

Manufacturing

The core remains

Digital Twin

↓

Knowledge Engine

↓

AI Concierge

↓

Visitor Intelligence

Only the domain model changes.

---

# ADR GOVERNANCE

New ADRs are required for changes affecting

Database schema

Authentication

Authorization

API contracts

AI orchestration

Prompt architecture

Billing

Technology stack

Service boundaries

Deployment architecture

Security model

Enterprise model

---

# CHANGE PROCESS

Proposal

↓

Technical Review

↓

Approval

↓

Implementation

↓

Documentation Update

↓

Release

No architectural change is complete until the corresponding ADR

is accepted.

---

# ENGINEERING RULES

Cursor SHALL

Read accepted ADRs before implementing related functionality.

Never violate an accepted ADR.

Create a proposed ADR when architecture must change.

Reference relevant ADRs in pull requests that implement

architectural decisions.

Treat ADRs as permanent engineering documentation.

---

# SUCCESS

The Architecture Decision Record library becomes the institutional

memory of PropertyPilot.

Every engineer should understand not only how the platform is built,

but why it was built that way.

Architectural consistency should improve over time rather than

degrade as the platform evolves.