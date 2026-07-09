# PropertyPilot

# ENG-010

# Testing Standards & Quality Engineering

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the mandatory testing strategy for

PropertyPilot.

Testing is not optional.

Every feature, service, API, AI interaction, workflow and deployment

must be validated before production.

The objective is confidence.

Not coverage percentages.

---

# QUALITY PHILOSOPHY

Quality is engineered.

Not inspected.

Testing exists to prevent regressions, protect customer trust and

ensure PropertyPilot behaves predictably under real-world conditions.

---

# TEST PYRAMID

```

Production Monitoring

↓

Manual Exploratory Testing

↓

End-to-End Tests

↓

API Contract Tests

↓

Integration Tests

↓

Unit Tests

```

Every level supports the level above.

---

# TEST FRAMEWORKS

Unit

Vitest

Component

React Testing Library

API

Vitest

Integration

Vitest

End-to-End

Playwright

Accessibility

axe-core

Performance

Lighthouse CI

Load Testing

k6

AI Evaluation

Internal Benchmark Suite

---

# TEST DIRECTORY

```

tests/

unit/

integration/

contracts/

e2e/

performance/

accessibility/

security/

ai/

fixtures/

golden-properties/

```

Every feature contains localized tests.

Global workflows live under

/tests

---

# UNIT TESTS

Test

Business Rules

Utilities

Validation

Formatting

Calculations

Scoring

Permissions

Prompt Builders

Recommendation Engine

Target

Critical business logic

100%

Overall

Meaningful coverage

Never test implementation details.

---

# COMPONENT TESTS

Validate

Rendering

Props

Variants

Loading

Errors

Accessibility

Keyboard

Dark Mode

Responsive behavior

No snapshot-only testing.

---

# INTEGRATION TESTS

Validate

Supabase

Storage

Authentication

Stripe

Resend

GoHighLevel

OpenAI

Queues

Repositories

Use sandbox providers.

Never production services.

---

# API CONTRACT TESTS

Every endpoint

Authentication

Authorization

Validation

Success

Failure

Pagination

Filtering

Sorting

Rate Limits

Error Model

Schema

Every endpoint has contract tests.

---

# END-TO-END TESTS

Critical journeys

Agent Registration

Login

Create Property

Upload Photos

Upload Documents

Record Voice Notes

Build Knowledge

Publish Property

Buyer QR Scan

Voice Conversation

Lead Capture

Brochure Request

CRM Synchronization

Billing

Subscription

Admin Login

These flows run automatically before release.

---

# AI EVALUATION

Every prompt validated.

Measure

Grounding

Accuracy

Completeness

Policy Compliance

Latency

Cost

Unknown Detection

Hallucination Risk

Injection Resistance

Regression

No prompt promoted without passing benchmarks.

---

# GOLDEN PROPERTY LIBRARY

Permanent test properties

Starter Home

Luxury Estate

Farm

Condominium

Commercial Building

Historic Home

Builder Spec Home

Rental Property

Every release tested against all.

---

# GOLDEN CONVERSATIONS

Maintain permanent conversations.

Examples

Roof Questions

HVAC

Unknown Questions

Inspection

Property Taxes

Prompt Injection

Fair Housing

Interruptions

Conversation Recovery

Expected responses documented.

---

# SECURITY TESTS

Authentication

Authorization

CSRF

XSS

SQL Injection

File Upload

Prompt Injection

Rate Limiting

Secret Exposure

Session Handling

Run automatically.

---

# ACCESSIBILITY TESTS

WCAG AA

Keyboard

Screen Reader

Focus

Contrast

Reduced Motion

Touch Targets

ARIA

Every page tested.

---

# PERFORMANCE TESTS

Targets

Homepage

<2 seconds

Dashboard

<2 seconds

Voice Startup

<1 second

Conversation Response

<2 seconds

Property Builder

<2 seconds

Search

<500 ms

PDF Generation

<30 seconds

Failures block release.

---

# LOAD TESTS

Simulate

100

500

1,000

5,000

Concurrent Visitors

Large Open Houses

Brokerages

Enterprise Imports

Voice Sessions

Measure

Latency

Errors

Recovery

Queue Growth

---

# DATABASE TESTS

Migration Safety

Indexes

Foreign Keys

RLS Policies

Soft Deletes

Triggers

Rollback

Seed Data

Performance

---

# MANUAL EXPLORATORY TESTING

Before every major release

Agent Workflow

Buyer Workflow

Seller Workflow

Admin Workflow

Enterprise Workflow

Document findings.

---

# REGRESSION TESTING

Every bug

Regression test.

Every fix

Regression test.

No exceptions.

---

# RELEASE GATES

Production deployment blocked if

Build fails

Tests fail

Security scan fails

Accessibility fails

Performance thresholds missed

AI benchmark fails

Database migration unsafe

Open critical defects exist

---

# DEFECT SEVERITY

Critical

Data Loss

Security

Billing

Authentication

Production Down

High

AI Failure

Conversation Failure

Publishing Failure

CRM Failure

Medium

UI

Reporting

Minor Bugs

Low

Visual

Text

Cosmetic

---

# TEST FIXTURES

Reusable

Organizations

Agents

Properties

Photos

Voice Notes

Knowledge Objects

Leads

Subscriptions

Never duplicate fixtures.

---

# MOCKING

Mock only

External providers

Time

Randomness

Network failures

Do not mock business rules.

---

# COVERAGE

Focus

Business Risk

Not percentages.

Suggested

Services

95%

Repositories

95%

Utilities

95%

Components

80%

Overall

90%+

---

# CONTINUOUS TESTING

Every Pull Request

Type Check

Lint

Unit

Integration

Contracts

Accessibility

Security

Preview Build

Every Merge

Performance

AI Benchmarks

Regression

---

# QUALITY DASHBOARD

Display

Build Status

Coverage

AI Accuracy

Open Defects

Critical Bugs

Performance Trends

Deployment Readiness

Security Findings

Knowledge Quality

---

# BUG LIFECYCLE

Reported

↓

Triaged

↓

Assigned

↓

Fixed

↓

Reviewed

↓

Regression Tested

↓

Released

↓

Verified

Root cause documented.

---

# ENGINEERING RULES

Cursor SHALL

Write tests with implementation.

Never merge untested features.

Never reduce coverage to pass builds.

Add regression tests for every bug.

Run AI benchmark suite before deployment.

Keep fixtures reusable.

Prefer deterministic tests.

Document failures.

Treat flaky tests as defects.

---

# SUCCESS

Every production release should increase confidence.

PropertyPilot should become known for predictable releases,

stable AI behavior, and high operational quality.

Testing is a core product capability, not a development afterthought.