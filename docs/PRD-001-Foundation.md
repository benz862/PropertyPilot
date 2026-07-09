# PropertyPilot.app

Version: 1.0

Status: MVP

Owner:
SkillBinder
Epoxy Dogs LLC

---

# Vision

PropertyPilot is an AI-powered property tour platform that allows buyers to walk through a home using a single QR code while speaking naturally with an intelligent voice assistant that understands every aspect of the property.

Instead of reading static brochures or waiting for an agent, visitors receive instant answers through conversational AI.

PropertyPilot transforms every property into a self-guided interactive experience.

---

# Mission

Create the world's best AI property expert.

The AI should feel like the listing agent is standing beside the buyer throughout the showing.

It should answer questions honestly.

It should never invent information.

It should make buyers more informed.

It should help realtors qualify better leads.

---

# Core Principles

1. Simplicity

A buyer should scan one QR code.

Nothing else.

No app installation.

No account creation.

No downloads.

Everything happens inside the browser.

---

2. Honesty

The AI must NEVER guess.

If information is unknown:

"I don't have verified information for that."

is always preferable to hallucinating.

---

3. Conversation

The visitor should feel like they are speaking with an experienced realtor.

Not a chatbot.

Responses should be concise.

Natural.

Professional.

Helpful.

---

4. Speed

Every page should load in under two seconds.

Voice latency should remain as low as technically possible.

---

5. Mobile First

100% of buyers will use phones.

Desktop is secondary.

Every screen must be designed for mobile before desktop.

---

# Primary Users

Listing Realtors

Brokerages

Builders

Luxury Home Sellers

Open Houses

Commercial Realtors

---

# Secondary Users

Potential Buyers

Potential Renters

Investors

Inspectors

Appraisers

---

# User Journey

Agent creates listing.

↓

Uploads information.

↓

Uploads photos.

↓

Creates Points of Interest.

↓

AI builds property knowledge.

↓

QR Code generated.

↓

QR printed.

↓

Placed at front entrance.

↓

Buyer scans QR.

↓

Buyer selects current location.

↓

Voice AI begins.

↓

Buyer asks questions.

↓

AI answers.

↓

Buyer moves to next location.

↓

Conversation continues.

↓

Tour completes.

↓

Lead capture.

↓

Brochure emailed.

↓

Lead pushed into CRM.

---

# Product Goals

Reduce repetitive questions.

Increase buyer engagement.

Increase lead quality.

Reduce agent workload.

Provide measurable analytics.

Differentiate realtor marketing.

---

# Non Goals

PropertyPilot is NOT:

An MLS.

A CRM.

A transaction management system.

An accounting package.

A website builder.

A virtual staging application.

A 3D tour application.

Those systems may integrate later.

They are not part of the MVP.

---

# Technology Stack

Frontend

Next.js

React

TypeScript

TailwindCSS

ShadCN

Backend

Supabase

Database

PostgreSQL

Authentication

Supabase Auth

Storage

Supabase Storage

Voice AI

OpenAI Realtime API

Large Language Model

OpenAI

Payments

Stripe

Email

Resend

CRM

GoHighLevel

Hosting

Vercel

Analytics

Supabase

---

# Coding Standards

Everything written in TypeScript.

Strict mode enabled.

No any types.

Server Components whenever possible.

Client Components only when necessary.

Every component must be reusable.

No duplicated code.

No inline styling.

Every page responsive.

Accessibility required.

Dark mode supported.

---

# Design Philosophy

Minimal.

Elegant.

Apple-quality interface.

Large typography.

Rounded corners.

Soft shadows.

Generous spacing.

Simple animations.

No clutter.

---

# Branding

Primary Color

#17394B

Accent

#E3B549

Background

White

Typography

Modern Sans Serif

---

# Architecture Philosophy

Every feature must be modular.

Every service isolated.

Everything API driven.

Nothing hard coded.

Every integration replaceable.

Future proof.

---

# Cursor Rules

Cursor SHALL NOT invent architecture.

Cursor SHALL NOT create unnecessary files.

Cursor SHALL reuse components.

Cursor SHALL document all APIs.

Cursor SHALL create typed interfaces.

Cursor SHALL use environment variables.

Cursor SHALL never expose secrets.

Cursor SHALL write production-ready code.

Cursor SHALL write maintainable code.

Cursor SHALL optimize for readability before cleverness.

---

# Success Criteria

A realtor can create an AI property tour in less than 15 minutes.

A buyer can scan one QR code and immediately begin speaking with the AI.

The AI answers accurately from the property knowledge base.

The buyer can request a brochure.

The realtor receives a qualified lead.