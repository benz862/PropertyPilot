# PropertyPilot

## PRD-002

# Core Data Architecture

Version: 2.0

Status: Approved

Priority: Critical

---

# Overview

Every property within PropertyPilot becomes a Digital Property Twin.

The Digital Property Twin is the single source of truth for every AI conversation, every QR tour, every brochure, every analytics report, and every buyer interaction.

The AI never answers from memory.

The AI never answers from assumptions.

The AI only answers using verified information contained inside the Digital Property Twin.

---

# Core Architecture

Everything revolves around one object.

PROPERTY

Everything else connects to it.

```

```

Property

│

├── Realtor

├── Photos

├── Documents

├── Knowledge Objects

├── Features

├── Systems

├── Improvements

├── Appliances

├── Utilities

├── Neighborhood

├── Schools

├── Voice Personality

├── AI Instructions

├── Points of Interest

├── Buyer Sessions

├── Analytics

├── Generated PDFs

├── QR Code

└── CRM Integrations

```

---

# Guiding Principles

## Single Source of Truth

Every fact exists only once.

Example

Roof Replacement

Exists one time.

The AI references it.

The brochure references it.

The QR tour references it.

The dashboard references it.

No duplicated data.

---

## Knowledge Before Conversation

The AI never searches random text.

Instead it reasons across structured knowledge.

---

## Context Aware

If the visitor is inside the Flex Space the AI understands that context.

However every property fact remains available.

Example

Visitor asks

"How old is the furnace?"

AI answers.

Even though the visitor is standing inside the workshop.

---

## Modular

Every feature can be replaced.

Voice provider.

LLM.

CRM.

Email provider.

Everything remains modular.

---

# Entity

PROFILE

Represents one paying customer.

Fields

UUID

Name

Company

Brokerage

Logo

Photo

Email

Phone

Subscription

Stripe Customer

GoHighLevel Location

Created

Updated

---

# Entity

PROPERTY

Represents one physical property.

Fields

UUID

Owner

MLS Number

Status

Street

City

Province/State

Postal Code

Country

Latitude

Longitude

Property Type

Bedrooms

Bathrooms

Finished Square Feet

Lot Size

Year Built

Annual Taxes

HOA

School District

Public Remarks

Private Notes

Listing Price

Created

Updated

---

# Entity

KNOWLEDGE OBJECT

This is the heart of PropertyPilot.

Every important thing becomes a Knowledge Object.

Examples

Roof

HVAC

Kitchen

Primary Bathroom

Pool

Electrical

Foundation

Garage

Flex Space

Windows

Driveway

Landscaping

Deck

Fireplace

Solar

Kitchen Island

Dishwasher

Well

Septic

Security System

Every object contains

UUID

Property

Category

Name

Summary

Verified Facts

Unknown Facts

Photos

Documents

Video

Confidence Level

Verification Source

Revision Number

Created

Updated

---

# Entity

FEATURE

Features describe amenities.

Examples

Quartz Countertops

Vaulted Ceiling

Skylight

Ceramic Tile

Brick Exterior

Forced Air Heating

Tankless Water Heater

220 Volt Service

French Doors

Features are reusable.

Knowledge Objects reference Features.

---

# Entity

SYSTEM

Examples

Roof

Electrical

Plumbing

Heating

Cooling

Security

Irrigation

Generator

Solar

Each system tracks

Manufacturer

Age

Warranty

Maintenance

Service History

Documentation

Notes

---

# Entity

APPLIANCE

Examples

Dishwasher

Refrigerator

Oven

Water Heater

Washer

Dryer

Manufacturer

Model

Serial Number

Purchase Date

Warranty

Included In Sale

Condition

---

# Entity

DOCUMENT

Inspection Reports

Property Disclosure

Floor Plans

Survey

Brochure

HOA Documents

Receipts

Warranty PDFs

Manuals

Every document is searchable by AI.

---

# Entity

PHOTO

Every image contains

Caption

Tags

Associated Knowledge Objects

Associated POIs

AI Generated Description

Display Order

---

# Entity

POINT OF INTEREST

Purpose

Guide the visitor.

A Point of Interest is not knowledge.

It is simply a location.

Examples

Front Entrance

Kitchen

Dining Room

Primary Bedroom

Flex Space

Pool

Garage

Backyard

Every POI contains

UUID

Display Order

Title

Subtitle

Map Position

Primary Knowledge Objects

Welcome Prompt

Thumbnail

Estimated Viewing Time

---

# Entity

VOICE PERSONALITY

Every property has one voice.

Examples

Professional Realtor

Luxury Concierge

Friendly Homeowner

Builder

Historic Expert

Fields

Voice

Speaking Speed

Greeting

Conversation Style

Tone

Humor

Formal

Informal

---

# Entity

AI POLICY

Every property includes instructions.

Example

Never guess.

Never discuss politics.

Never estimate values.

Never speculate.

Never answer legal questions.

Always distinguish verified facts.

Always disclose uncertainty.

Always encourage contacting the listing agent when necessary.

---

# Entity

VISITOR SESSION

Tracks one visitor.

UUID

Property

Session

Device

Browser

Operating System

Language

Started

Ended

Lead

Conversation

Analytics

---

# Entity

LEAD

Name

Email

Phone

Consent

Requested Showing

Requested PDF

Notes

CRM Status

Created

---

# Entity

CONVERSATION

Every conversation becomes searchable.

Stores

Transcript

Intent

Questions

Answers

Escalations

Token Usage

Duration

---

# Entity

ANALYTICS

Tracks everything.

Examples

QR Scan

POI Viewed

Time Spent

Questions Asked

Most Requested Feature

PDF Download

Showing Request

Conversation Length

Exit Point

---

# Entity

INTEGRATIONS

OpenAI

GoHighLevel

Stripe

Resend

Supabase Storage

Google Calendar

Twilio (future)

MLS (future)

---

# Security

Every table uses UUID.

Every table uses Row Level Security.

Every request authenticated.

Every upload virus scanned.

Every document encrypted.

No public admin endpoints.

Every API logged.

---

# Storage

Supabase Storage

Buckets

avatars

logos

property-photos

documents

generated-pdfs

voice-assets

qr-codes

exports

---

# Database Philosophy

The database is designed so that:

One property can contain thousands of verified facts.

Millions of conversations can reference those facts.

The AI always answers from structured knowledge.

Every future feature—including valuation tools, maintenance tracking, seller portals, buyer portals, commercial properties, rentals, and builders—can be added without redesigning the database.

---

# Cursor Engineering Rules

Cursor SHALL:

- Generate normalized PostgreSQL schemas.

- Use UUID primary keys exclusively.

- Enforce foreign keys on all relationships.

- Implement Row Level Security before building UI.

- Generate TypeScript interfaces from the database schema.

- Build repositories/services before page components.

- Never duplicate business logic.

- Keep AI prompt construction isolated in a dedicated service layer.

- Store prompts, policies, and voice configuration as data—not hard-coded strings.

- Design every module to be independently testable.

---

# Definition of Success

PropertyPilot is not a QR code application.

PropertyPilot is a Digital Property Intelligence Platform.

The QR code, voice assistant, brochures, analytics, CRM integration, and future capabilities are simply different ways of interacting with the same Digital Property Twin.