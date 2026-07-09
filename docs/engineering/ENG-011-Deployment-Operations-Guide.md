# PropertyPilot

# ENG-011

# Deployment & Operations Guide

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines how PropertyPilot is deployed, monitored,

operated, maintained and recovered.

No production deployment may occur without following this guide.

Every deployment must be repeatable.

Every deployment must be reversible.

Every deployment must be observable.

---

# DEPLOYMENT PHILOSOPHY

Deploy frequently.

Deploy safely.

Deploy automatically.

Rollback immediately when necessary.

Never deploy manually to production.

Infrastructure should be treated as code.

---

# TECHNOLOGY STACK

Hosting

Vercel

Database

Supabase PostgreSQL

Storage

Supabase Storage

Authentication

Supabase Auth

AI

OpenAI

Payments

Stripe

Email

Resend

CRM

GoHighLevel

Source Control

GitHub

Monitoring

Vercel Analytics

Supabase Dashboard

Future

Sentry

PostHog

Grafana

OpenTelemetry

---

# ENVIRONMENTS

Local

Development

Preview

Staging

Production

Every environment

Own database

Own storage

Own secrets

Own API keys

No shared infrastructure.

---

# ENVIRONMENT VARIABLES

Every environment validates

OpenAI Keys

Supabase URL

Supabase Keys

Stripe Keys

Resend Keys

GoHighLevel Keys

JWT Secrets

Encryption Keys

Application URL

Validation occurs at startup.

Deployment fails if invalid.

---

# DEPLOYMENT PIPELINE

```

Developer

↓

Feature Branch

↓

Pull Request

↓

Automated Tests

↓

Preview Deployment

↓

Code Review

↓

Merge

↓

Staging

↓

Acceptance Testing

↓

Production Approval

↓

Production Deployment

↓

Health Verification

↓

Monitoring

```

---

# PRODUCTION CHECKLIST

Before deployment

Build succeeds

TypeScript passes

Lint passes

Unit tests pass

Integration tests pass

AI benchmarks pass

Accessibility passes

Performance targets met

Database migrations verified

Rollback confirmed

Release notes written

Monitoring enabled

Feature flags configured

---

# DATABASE MIGRATIONS

Every migration

Reviewed

Versioned

Rollback documented

Timed

Tested

Non-destructive unless approved

Migration order

Backup

↓

Migration

↓

Verification

↓

Application Release

Never modify production schema manually.

---

# FEATURE FLAGS

Every new feature

Internal

Beta

Pilot

Regional

Production

Kill Switch

Feature flags stored centrally.

---

# CANARY RELEASES

Support

1%

5%

10%

25%

50%

100%

Monitor

Errors

Latency

AI quality

CRM sync

Billing

Rollback immediately if thresholds exceeded.

---

# ROLLBACK STRATEGY

Application

Instant Vercel rollback

Database

Backward-compatible migrations

Feature

Disable via feature flag

AI

Revert prompt version

Model

Switch provider

Every rollback documented.

---

# MONITORING

Monitor

API latency

Database health

Voice latency

Conversation failures

Knowledge retrieval

Queue depth

Email delivery

Stripe webhooks

CRM sync

Storage usage

Authentication

Realtime connections

---

# ALERTS

Critical

Production unavailable

Authentication failure

Database unavailable

OpenAI unavailable

Stripe unavailable

Webhook failures

High

Latency increase

Queue backlog

Conversation failures

Storage nearing capacity

Medium

Usage spikes

Failed email delivery

Retry queue growth

Low

Feature flag mismatch

Background job delays

---

# HEALTH CHECKS

Endpoints

/health

/health/database

/health/storage

/health/openai

/health/stripe

/health/resend

/health/crm

Health endpoints return

Status

Latency

Version

Timestamp

Dependencies

---

# LOGGING

Structured logs only.

Every request includes

Request ID

Correlation ID

User ID

Organization ID

Property ID

Conversation ID (if applicable)

Log levels

Debug

Info

Warning

Error

Critical

No sensitive data logged.

---

# BACKUPS

Database

Point-in-time recovery

Daily snapshots

Storage

Versioned

Configuration

Version controlled

Prompt Library

Versioned

Verification

Monthly restore testing

---

# DISASTER RECOVERY

Recovery Time Objective

<2 hours

Recovery Point Objective

<15 minutes

Procedures

Database restore

Storage restore

DNS validation

API verification

Webhook verification

Smoke tests

Document every recovery.

---

# INCIDENT MANAGEMENT

Lifecycle

Detected

↓

Acknowledged

↓

Assigned

↓

Investigated

↓

Mitigated

↓

Resolved

↓

Postmortem

Every incident receives

Timeline

Root Cause

Corrective Action

Preventive Action

---

# JOB PROCESSING

Queues

Photo Processing

Voice Processing

Document Parsing

Asset Generation

CRM Sync

Email Delivery

Analytics

Knowledge Extraction

Retry Policy

Exponential backoff

Dead Letter Queue

Manual retry supported.

---

# SECURITY OPERATIONS

Rotate secrets

Review API keys

Monitor authentication

Audit permissions

Review failed logins

Monitor suspicious activity

Quarterly security review

---

# PERFORMANCE TARGETS

Homepage

<2 seconds

Dashboard

<2 seconds

Voice Startup

<1 second

Conversation Response

<2 seconds

Knowledge Lookup

<500 ms

Search

<500 ms

Brochure Generation

<30 seconds

Publish Property

<10 seconds

---

# SCALING

Scale

Horizontally

Stateless services

Independent queues

Database optimization

CDN caching

Edge rendering

Connection pooling

Prepared for

100,000+

Properties

Millions of conversations

Thousands of concurrent users

---

# MAINTENANCE WINDOWS

Scheduled

Announced

Visible on Status Page

Rollback prepared

Customer communication automated

No unplanned downtime when avoidable.

---

# OBSERVABILITY

Track

Deployments

Feature adoption

System health

Error trends

Latency

AI costs

Conversation quality

Knowledge growth

Customer health

Operational metrics available in real time.

---

# DOCUMENTATION

Maintain

Runbooks

Recovery guides

Deployment checklist

Infrastructure diagrams

Architecture diagrams

Environment setup

Release process

Incident procedures

All documentation stored in Git.

---

# ENGINEERING RULES

Cursor SHALL

Never deploy directly to production.

Never bypass CI/CD.

Never skip health verification.

Never modify production data manually.

Always verify migrations.

Always support rollback.

Always document infrastructure changes.

Always log operational events.

Treat operations as code.

---

# SUCCESS

Deployments become routine.

Failures are isolated.

Recovery is fast.

Monitoring is proactive.

PropertyPilot remains reliable as customer count,

conversation volume and infrastructure complexity grow.