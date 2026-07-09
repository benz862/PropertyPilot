# PropertyPilot

# ENG-005

# Frontend Architecture

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the frontend architecture for PropertyPilot.

The frontend must remain modular, scalable, maintainable and

accessible while providing an exceptional user experience.

The frontend is responsible for presentation only.

Business logic belongs in backend services.

---

# CORE PRINCIPLES

Presentation First

API First

Server Components by Default

Accessibility Required

Mobile First

Responsive Everywhere

Progressive Enhancement

Performance by Design

---

# TECHNOLOGY STACK

Framework

Next.js App Router

Language

TypeScript

Styling

Tailwind CSS

UI Components

shadcn/ui

Animation

Framer Motion

Forms

React Hook Form

Validation

Zod

Icons

Lucide React

Tables

TanStack Table

Charts

Recharts

State

React Context

Server State

TanStack Query

Utilities

clsx

tailwind-merge

date-fns

---

# APPLICATION STRUCTURE

```

app/

(auth)

(dashboard)

(properties)

(marketing)

(analytics)

(admin)

api/

layout.tsx

loading.tsx

error.tsx

not-found.tsx

providers.tsx

middleware.ts

```

---

# FEATURE STRUCTURE

Every feature lives inside

/features

Example

```

features/

property/

components/

hooks/

services/

schemas/

types/

utils/

constants/

pages/

voice/

analytics/

crm/

knowledge/

marketing/

admin/

```

Features are isolated.

No cross-feature imports except through shared services.

---

# SHARED DIRECTORIES

```

components/

ui/

layout/

navigation/

charts/

forms/

voice/

feedback/

providers/

hooks/

lib/

utils/

types/

config/

constants/

```

---

# ROUTING

App Router only.

No Pages Router.

Example

```

/dashboard

/properties

/properties/new

/properties/[propertyId]

/properties/[propertyId]/builder

/properties/[propertyId]/knowledge

/properties/[propertyId]/marketing

/properties/[propertyId]/analytics

/admin

/settings

/profile

```

---

# LAYOUT HIERARCHY

```

Root Layout

↓

Authenticated Layout

↓

Dashboard Layout

↓

Feature Layout

↓

Page

↓

Components

```

Layouts manage

Navigation

Authentication

Theme

Breadcrumbs

Global providers

---

# STATE MANAGEMENT

React State

Small local state

Context

Theme

Authentication

User

Organization

TanStack Query

Server data

Caching

Optimistic updates

Realtime refresh

No Redux.

No MobX.

No global state without justification.

---

# SERVER COMPONENTS

Default

Use Server Components whenever possible.

Client Components only when

Forms

Animations

Realtime

Browser APIs

Voice

Drag & Drop

Charts

---

# DATA FLOW

```

Component

↓

Hook

↓

API Client

↓

Server Action

↓

Service Layer

↓

API

↓

Database

```

Components never communicate directly with Supabase.

---

# DESIGN SYSTEM

Single design language.

Colors

Typography

Spacing

Icons

Cards

Forms

Buttons

Modals

Tables

Badges

Status

Alerts

Everything reusable.

---

# DESIGN TOKENS

Stored centrally.

Examples

```

colors.ts

spacing.ts

radius.ts

shadows.ts

typography.ts

animation.ts

```

No hardcoded styling.

---

# THEMES

Support

Light

Dark

System

Future

Broker branding

Custom themes

High Contrast

---

# NAVIGATION

Sidebar

Desktop

Bottom Navigation

Mobile

Breadcrumbs

Context Navigation

Command Palette

Global Search

Navigation generated from configuration.

---

# FORMS

React Hook Form

Zod

Autosave

Dirty State Detection

Validation

Optimistic UI

Draft Recovery

Every long form automatically saves progress.

---

# TABLES

TanStack Table

Features

Sorting

Filtering

Pagination

Column Visibility

Grouping

Export

Selection

Virtualization

---

# SEARCH

Universal Search

Instant Results

Keyboard Navigation

Command Palette Integration

Supports

Properties

Knowledge

Documents

Photos

Voice Notes

Leads

Templates

Organizations

---

# FILE UPLOADS

Drag & Drop

Progress

Resume

Preview

Multiple Files

Background Upload

Validation

Supported

Photos

Voice

PDF

Documents

---

# VOICE UI

Dedicated components

Microphone

Waveform

Realtime Transcript

Speaking Indicator

Thinking Indicator

Connection Status

Latency Indicator

Interrupt Button

Conversation History

No browser default controls.

---

# PROPERTY BUILDER

Wizard

Step Navigation

Progress

Resume

Validation

Knowledge Suggestions

Photo Analysis

Document Parsing

Voice Notes

Timeline

Publishing Checklist

---

# BUYER EXPERIENCE

Public UI

Minimal

Fast

Touch Friendly

No login required

Voice First

Progressive loading

Offline messaging

---

# DASHBOARD

Cards

Metrics

Recommendations

Notifications

Tasks

Activity

Recent Properties

System Health

Configurable widgets.

---

# ERROR HANDLING

Global Error Boundary

Feature Error Boundary

Loading States

Retry

Offline Detection

Graceful fallback

Never expose technical errors.

---

# EMPTY STATES

Every page includes

Illustration

Explanation

Primary Action

Help Link

Never show blank screens.

---

# LOADING STATES

Skeletons

Progress Indicators

Streaming UI

Optimistic Updates

Background Refresh

No blocking spinners unless unavoidable.

---

# ACCESSIBILITY

WCAG AA

Keyboard Navigation

ARIA

Screen Reader Support

Focus Management

Large Touch Targets

Color Contrast

Reduced Motion

Every page tested.

---

# RESPONSIVE BREAKPOINTS

Mobile

Tablet

Laptop

Desktop

Wide

Ultra-wide

Layouts adapt gracefully.

---

# PERFORMANCE

Targets

First Paint

<1 second

Interactive

<2 seconds

Largest Contentful Paint

<2.5 seconds

Code splitting

Lazy loading

Image optimization

Streaming

---

# INTERNATIONALIZATION

Architecture prepared for

Multiple Languages

RTL

Localized Dates

Localized Currency

Localized Measurements

Version 1 ships in English.

---

# ENGINEERING RULES

Cursor SHALL

Use Server Components by default.

Build reusable components.

Never duplicate layouts.

Never hardcode colors.

Never hardcode spacing.

Never place business logic inside components.

Prefer composition over inheritance.

Prefer configuration over conditionals.

Create components that are independently testable.

Use strict TypeScript.

Document public component props.

---

# SUCCESS

The frontend should feel

Fast

Elegant

Professional

Calm

Predictable

Every interaction should reduce friction.

Every screen should reinforce that PropertyPilot is a premium

professional platform built for long-term daily use.