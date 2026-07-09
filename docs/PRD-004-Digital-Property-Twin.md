# PropertyPilot

# PRD-004

# Digital Property Twin Engine

Version: 1.0

Status

APPROVED

Priority

CRITICAL

---

# Vision

Every property inside PropertyPilot becomes a living digital representation of the real property.

We call this the Digital Property Twin.

The Property Twin is the intelligence layer that powers every conversation, brochure, report, QR tour, lead interaction and AI response.

The Property Twin continuously grows as new information is added.

It is never recreated.

It evolves.

---

# Philosophy

Every property tells a story.

Our job is to organize that story into verified knowledge.

PropertyPilot is not storing documents.

It is constructing understanding.

---

# Property Twin Components

Every Property Twin contains:

Property Profile

↓

Knowledge Graph

↓

Photos

↓

Documents

↓

Systems

↓

Improvements

↓

Appliances

↓

Features

↓

Points of Interest

↓

Maintenance History

↓

Neighborhood Intelligence

↓

Voice Personality

↓

Conversation Rules

↓

Marketing Assets

↓

Analytics

---

# Property Profile

The master record.

Contains

Address

Coordinates

MLS Number

Property Type

Bedrooms

Bathrooms

Square Footage

Lot Size

Year Built

Listing Price

Listing Status

Agent

Brokerage

School District

Utilities

Tax Information

HOA

Property Description

---

# Knowledge Graph

The heart of PropertyPilot.

Everything important becomes a node.

Example

Roof

↓

Shingles

↓

Installed 2024

↓

Warranty

↓

Contractor

↓

Receipt

Everything becomes connected.

Example

Flex Space

↓

220 Volt Service

↓

Electrical Panel

↓

Utility Sink

↓

Tankless Water Heater

↓

Ceramic Tile

↓

Heating

↓

Cooling

↓

Workshop Uses

The AI reasons across these relationships.

---

# Knowledge Categories

Structural

Mechanical

Electrical

Plumbing

Interior

Exterior

Landscape

Appliances

Safety

Accessibility

Luxury Features

Energy Efficiency

Technology

Maintenance

Renovations

Neighborhood

Community

Schools

Utilities

Legal Documents

HOA

Insurance

Miscellaneous

---

# Sources of Knowledge

Information enters the Twin from:

MLS

Agent

Homeowner

Builder

Inspection Reports

Photos

Voice Notes

PDF Documents

Warranty Documents

Floor Plans

Manual Entry

Future Integrations

---

# Verification Levels

Every fact has verification.

Verified

Confirmed by owner or documentation.

Likely

Observed but awaiting confirmation.

Unknown

No verified information.

Conflicting

Two sources disagree.

Retired

Previously true but superseded.

The AI always prefers:

Verified

↓

Likely

↓

Unknown

Never use Retired unless explaining history.

---

# Fact Versioning

Every fact is versioned.

Example

Roof

Version 1

Original Asphalt Roof

Installed 1967

Retired 2024

↓

Version 2

Architectural Shingles

Installed 2024

Verified

Nothing is overwritten.

Everything is historically preserved.

---

# Knowledge Relationships

Facts can reference facts.

Example

Dishwasher

↓

Kitchen

↓

Electrical

↓

Warranty

↓

Manual

↓

Purchase Receipt

↓

Included In Sale

The AI navigates these links naturally.

---

# Property Timeline

Every major event becomes part of a timeline.

Examples

Built

Roof Replacement

Kitchen Remodel

HVAC Installation

Deck Added

Pool Installed

Water Heater Replaced

Painting

Flooring Replacement

Timeline helps answer:

"What improvements have been made?"

---

# Photo Intelligence

Every uploaded photo is analyzed.

Generate

Caption

Detected Features

Room

Objects

Suggested Knowledge Objects

Quality Score

Duplicate Detection

Missing Coverage Detection

Example

Kitchen

Detected

Island

Quartz

Pendant Lighting

Stainless Appliances

Skylight

Soft Close Cabinets

The AI suggests additions but never marks them Verified without user approval.

---

# Document Intelligence

Every document is parsed.

Examples

Inspection Report

Warranty

Disclosure

Floor Plan

Manual

The AI extracts

Dates

Manufacturers

Model Numbers

Serial Numbers

Measurements

Maintenance

Recommendations

Unknown items require review.

---

# Voice Note Intelligence

This becomes one of PropertyPilot's defining features.

The agent or homeowner can simply walk the property and talk.

Example

"This room was remodeled in 2018..."

The AI automatically

Creates Knowledge Objects

Links Features

Creates FAQs

Suggests Buyer Questions

Detects Missing Information

Requests Verification where needed

Voice notes become structured knowledge—not just transcripts.

---

# Missing Knowledge Detection

The AI continuously audits the Twin.

Examples

HVAC Age Missing

Roof Warranty Missing

Dishwasher Model Missing

Unknown Flooring

No Backyard Photos

Missing Electrical Information

The dashboard displays a Property Completeness Score.

---

# Property Completeness Score

0–100%

Scored by

Core Property Data

Systems

Appliances

Photos

Documents

POIs

Neighborhood

Maintenance

Verification Coverage

Goal

Every property reaches 90%+ before publishing.

---

# AI Suggestions

The AI continuously recommends improvements.

Examples

Upload garage photos.

Record a voice note for the Flex Space.

Add HVAC maintenance records.

Verify roof installation date.

Upload property survey.

The realtor can accept or dismiss each suggestion.

---

# Publishing Requirements

A property cannot be published unless:

Required fields completed

At least one POI exists

Primary photos uploaded

AI policy configured

Voice personality selected

Knowledge verification above minimum threshold

---

# Future Expansion

The Digital Property Twin is designed to support:

Commercial properties

Rental properties

Builders

New construction

Luxury estates

Property management

Insurance documentation

Maintenance tracking

Renovation history

Asset management

Homeowner portals

---

# Cursor Engineering Rules

Build the Twin as a service layer.

No AI prompt may read raw tables directly.

All AI requests must use a Property Twin service.

Knowledge Graph must be queryable.

Version every fact.

Never permanently delete facts.

Soft delete only.

Every update creates an audit record.

---

# Success Criteria

The Digital Property Twin becomes the definitive source of truth for every property.

Every AI answer, brochure, QR interaction, analytics report and future feature must originate from the Twin.

The Twin should continue improving throughout the life of the listing and remain valuable even after the property is sold.