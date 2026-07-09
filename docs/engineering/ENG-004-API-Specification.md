# PropertyPilot

# ENG-004

# API Specification

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the API contract for PropertyPilot.

The API is the only supported interface between the frontend and

the backend.

Every feature must be accessible through an API before it is

accessible through the UI.

All APIs must be versioned, documented, typed, tested, and secured.

---

# API PHILOSOPHY

API First

REST Based

JSON Payloads

Version Controlled

Stateless

Predictable

Idempotent where applicable

Every endpoint must exist for a business reason.

Never expose database tables directly.

---

# BASE URL

Development

/api/v1

Production

[https://api.propertypilot.app/v1](https://api.propertypilot.app/v1)

---

# API VERSIONING

Version

v1

Future

v2

v3

Breaking changes require a new version.

Older versions remain supported according to the platform's deprecation policy.

---

# AUTHENTICATION

Public

No authentication required

Authenticated

JWT required

Enterprise

OAuth

API Keys

Every request authenticated unless explicitly marked public.

---

# AUTHORIZATION

Every endpoint validates

Authentication

Organization Membership

Office Membership

Team Membership

Permissions

Ownership

Authorization is enforced server-side.

---

# STANDARD RESPONSE

Success

```json

{

  "success": true,

  "data": {},

  "meta": {},

  "requestId": "uuid",

  "timestamp": "ISO-8601"

}

```

Error

```json

{

  "success": false,

  "error": {

    "code": "PROPERTY_NOT_FOUND",

    "message": "Property could not be located."

  },

  "requestId": "uuid",

  "timestamp": "ISO-8601"

}

```

---

# STANDARD HTTP STATUS

200 OK

201 Created

202 Accepted

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

429 Rate Limited

500 Internal Error

503 Service Unavailable

---

# RESOURCE GROUPS

Authentication

Users

Organizations

Properties

Knowledge

Photos

Documents

Voice

Conversations

Visitors

Leads

Marketing

Analytics

Commerce

CRM

Notifications

Administration

Audit

Search

Health

---

##########################################################

AUTHENTICATION

##########################################################

POST

/auth/login

POST

/auth/logout

POST

/auth/refresh

POST

/auth/password/reset

GET

/auth/me

---

##########################################################

USERS

##########################################################

GET

/users

GET

/users/{id}

POST

/users

PATCH

/users/{id}

DELETE

/users/{id}

---

##########################################################

ORGANIZATIONS

##########################################################

GET

/organizations

GET

/organizations/{id}

POST

/organizations

PATCH

/organizations/{id}

---

##########################################################

PROPERTIES

##########################################################

GET

/properties

GET

/properties/{id}

POST

/properties

PATCH

/properties/{id}

DELETE

/properties/{id}

POST

/properties/{id}/publish

POST

/properties/{id}/archive

POST

/properties/{id}/duplicate

GET

/properties/{id}/health

GET

/properties/{id}/timeline

---

##########################################################

PROPERTY BUILDER

##########################################################

POST

/properties/{id}/photos/upload

POST

/properties/{id}/documents/upload

POST

/properties/{id}/voice/upload

POST

/properties/{id}/builder/analyze

POST

/properties/{id}/builder/rebuild

GET

/properties/{id}/builder/status

---

##########################################################

KNOWLEDGE

##########################################################

GET

/knowledge

GET

/knowledge/{id}

POST

/knowledge

PATCH

/knowledge/{id}

DELETE

/knowledge/{id}

POST

/knowledge/{id}/approve

POST

/knowledge/{id}/reject

POST

/knowledge/search

---

##########################################################

PHOTOS

##########################################################

POST

/photos

PATCH

/photos/{id}

DELETE

/photos/{id}

POST

/photos/{id}/analyze

POST

/photos/{id}/feature

---

##########################################################

DOCUMENTS

##########################################################

POST

/documents

GET

/documents/{id}

PATCH

/documents/{id}

DELETE

/documents/{id}

POST

/documents/{id}/extract

---

##########################################################

VOICE

##########################################################

POST

/voice/session/start

POST

/voice/session/end

POST

/voice/session/interruption

GET

/voice/session/{id}

POST

/voice/profile

PATCH

/voice/profile

---

##########################################################

CONVERSATIONS

##########################################################

GET

/conversations

GET

/conversations/{id}

GET

/conversations/{id}/messages

GET

/conversations/{id}/summary

POST

/conversations/{id}/regenerate

---

##########################################################

VISITORS

##########################################################

POST

/visitor/start

POST

/visitor/end

POST

/visitor/identify

GET

/visitor/session/{id}

---

##########################################################

LEADS

##########################################################

GET

/leads

POST

/leads

PATCH

/leads/{id}

DELETE

/leads/{id}

POST

/leads/{id}/crm

POST

/leads/{id}/brochure

POST

/leads/{id}/showing

---

##########################################################

MARKETING

##########################################################

POST

/marketing/brochure

POST

/marketing/sign

POST

/marketing/social

POST

/marketing/pdf

POST

/marketing/qr

GET

/marketing/assets/{id}

---

##########################################################

ANALYTICS

##########################################################

GET

/analytics/dashboard

GET

/analytics/property/{id}

GET

/analytics/organization/{id}

GET

/analytics/trends

GET

/analytics/recommendations

---

##########################################################

COMMERCE

##########################################################

GET

/plans

GET

/subscription

POST

/subscription/change

POST

/billing/portal

GET

/invoices

GET

/property-credits

---

##########################################################

CRM

##########################################################

POST

/crm/connect

POST

/crm/disconnect

POST

/crm/sync

GET

/crm/status

GET

/crm/log

---

##########################################################

ADMIN

##########################################################

GET

/admin/dashboard

GET

/admin/system

GET

/admin/jobs

GET

/admin/logs

POST

/admin/feature-flag

POST

/admin/announcement

---

##########################################################

AUDIT

##########################################################

GET

/audit

GET

/audit/{id}

---

##########################################################

SEARCH

##########################################################

POST

/search

Universal Search

Supports

Properties

Knowledge

Photos

Voice Notes

Documents

Leads

Templates

Organizations

---

##########################################################

HEALTH

##########################################################

GET

/health

GET

/health/database

GET

/health/storage

GET

/health/openai

GET

/health/stripe

GET

/health/crm

---

# REQUEST VALIDATION

Every endpoint validates

Authentication

Authorization

Input

Business Rules

Organization Context

Ownership

Schema

Validation occurs before business logic.

---

# PAGINATION

Cursor based

Example

```text

GET /properties?cursor=abc123&limit=25

```

Never use offset pagination.

---

# FILTERING

Standard Parameters

status

organization

agent

createdAfter

createdBefore

updatedAfter

updatedBefore

search

sort

limit

cursor

---

# SORTING

Standard

created_at

updated_at

name

status

score

direction

asc

desc

---

# RATE LIMITS

Public

60 requests/minute

Authenticated

600 requests/minute

Enterprise

Configurable

AI endpoints

Separate limits

---

# IDEMPOTENCY

Required

Payments

Lead Creation

Publishing

Asset Generation

CRM Sync

Header

Idempotency-Key

---

# WEBHOOKS

Outgoing

Property Published

Lead Created

Lead Updated

Conversation Completed

Brochure Generated

Showing Requested

Knowledge Approved

Subscription Changed

Incoming

Stripe

GoHighLevel

Resend

Future providers

---

# API DOCUMENTATION

Generate automatically.

OpenAPI 3.1

Swagger UI

Redoc

JSON Schema

Never manually maintain endpoint documentation.

---

# ENGINEERING RULES

Cursor SHALL

Never expose database tables.

Never expose internal IDs unnecessarily.

Never bypass authorization.

Never return untyped payloads.

Always validate requests.

Always validate responses.

Document every endpoint.

Generate OpenAPI automatically.

Write integration tests for every endpoint.

---

# SUCCESS

The PropertyPilot API should be stable enough that:

- The web application,

- a future native mobile app,

- third-party integrations,

- enterprise customers,

- and future AI agents

can all interact with the platform without requiring changes to the underlying business logic.