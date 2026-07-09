# PropertyPilot

# ENG-003

# Database Schema & Standards

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the complete PostgreSQL database architecture.

It is the authoritative source for:

- Tables

- Relationships

- Naming

- Constraints

- Indexes

- Row Level Security

- Migrations

- Triggers

- Views

- Enums

No database object may be created without conforming to this document.

---

# DATABASE PHILOSOPHY

The database is the foundation of the Digital Property Twin.

Every table represents a business concept.

Every relationship represents a business relationship.

The schema should remain readable by humans.

Normalization is preferred.

Denormalization only when performance justifies it.

---

# GLOBAL STANDARDS

Every table SHALL contain

id UUID PRIMARY KEY

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ

created_by UUID

updated_by UUID

deleted_at TIMESTAMPTZ NULL

version INTEGER DEFAULT 1

---

# UUID STANDARD

Every primary key

UUID v7 (preferred)

Fallback

UUID v4

No integer primary keys.

---

# NAMING CONVENTIONS

Tables

plural_snake_case

Examples

properties

knowledge_objects

buyer_sessions

conversation_messages

Columns

snake_case

Foreign Keys

property_id

organization_id

knowledge_object_id

Indexes

idx_<table>_<column>

Example

idx_properties_status

---

# DATABASE DOMAINS

Identity

Organizations

Properties

Knowledge

Voice

Buyer Intelligence

Marketing

Commerce

Analytics

Administration

Audit

Integrations

Each domain owns its tables.

---

###########################################################

IDENTITY DOMAIN

###########################################################

profiles

organizations

offices

teams

organization_members

roles

permissions

user_roles

api_keys

user_sessions

---

profiles

Purpose

Authenticated users.

Columns

id

email

first_name

last_name

phone

avatar_url

timezone

status

last_login_at

---

organizations

Stores

Brokerages

Companies

Enterprise Accounts

Fields

id

name

slug

logo_url

website

subscription_id

branding_theme

default_voice

status

---

offices

Belongs To

Organization

Stores

Physical office.

Fields

organization_id

name

address

phone

manager_id

---

teams

Belongs To

Office

Stores

Agent teams.

---

###########################################################

PROPERTY DOMAIN

###########################################################

properties

property_addresses

property_status_history

property_timelines

property_settings

property_versions

points_of_interest

property_maps

property_access_tokens

property_publications

property_assets

---

properties

Fields

organization_id

owner_profile_id

mls_number

title

property_type

status

asking_price

year_built

square_feet

lot_size

bedrooms

bathrooms

description

health_score

published_at

---

property_addresses

Separate table.

Allows future multi-address properties.

Fields

property_id

street

city

state

postal_code

country

latitude

longitude

---

points_of_interest

Fields

property_id

display_order

name

slug

summary

map_position

estimated_view_time

voice_intro

active

---

###########################################################

KNOWLEDGE DOMAIN

###########################################################

knowledge_objects

knowledge_facts

knowledge_relationships

knowledge_categories

knowledge_sources

knowledge_versions

knowledge_reviews

knowledge_tags

knowledge_comments

knowledge_conflicts

knowledge_timelines

---

knowledge_objects

Fields

property_id

category_id

title

summary

verification_status

confidence

current_version

health_score

---

knowledge_facts

Fields

knowledge_object_id

fact_key

fact_type

fact_value

unit

verified

source_id

effective_date

expiration_date

---

knowledge_relationships

Fields

parent_object_id

child_object_id

relationship_type

weight

---

knowledge_versions

Every modification.

Never delete.

Append only.

---

###########################################################

PHOTO DOMAIN

###########################################################

photos

photo_analysis

photo_tags

photo_versions

photo_collections

photo_comments

---

photos

Fields

property_id

knowledge_object_id

poi_id

storage_path

caption

display_order

featured

analysis_status

---

###########################################################

DOCUMENT DOMAIN

###########################################################

documents

document_types

document_analysis

document_versions

document_extractions

document_signatures

---

documents

Fields

property_id

document_type

storage_path

status

uploaded_by

verified

---

###########################################################

VOICE DOMAIN

###########################################################

voice_profiles

voice_notes

voice_sessions

voice_messages

voice_transcripts

voice_events

conversation_memory

conversation_summaries

---

voice_notes

Fields

property_id

poi_id

storage_path

transcript

processing_status

knowledge_generated

---

voice_sessions

Fields

property_id

visitor_session_id

started_at

ended_at

duration_seconds

language

voice_profile

---

###########################################################

BUYER DOMAIN

###########################################################

visitor_sessions

buyer_profiles

buyer_interests

buyer_concerns

buyer_intent

leads

showing_requests

buyer_feedback

---

visitor_sessions

Fields

property_id

anonymous_id

device

browser

language

started_at

ended_at

---

leads

Fields

property_id

visitor_session_id

first_name

last_name

email

phone

preferred_contact

consent

crm_status

---

###########################################################

MARKETING DOMAIN

###########################################################

marketing_assets

asset_versions

asset_templates

generated_brochures

generated_signs

generated_pdfs

generated_qr

social_assets

---

###########################################################

ANALYTICS DOMAIN

###########################################################

analytics_events

analytics_sessions

analytics_metrics

recommendations

benchmarks

property_scores

daily_snapshots

---

analytics_events

Fields

property_id

visitor_session_id

event_type

event_data JSONB

occurred_at

---

###########################################################

COMMERCE DOMAIN

###########################################################

subscriptions

plans

property_credits

entitlements

billing_events

usage_metrics

licenses

---

###########################################################

CRM DOMAIN

###########################################################

crm_connections

crm_mappings

crm_sync_queue

crm_sync_log

crm_webhooks

---

###########################################################

AUDIT DOMAIN

###########################################################

audit_log

security_events

login_history

permission_changes

system_events

---

###########################################################

INDEXING RULES

###########################################################

Index

Every Foreign Key

Every Status Column

Every Slug

Every Timestamp

Every Public Token

Every Search Column

Composite Indexes

Created after workload analysis.

---

###########################################################

ROW LEVEL SECURITY

###########################################################

Enabled on every table.

Policies

Owner

Organization

Office

Team

Read Only

Admin

Anonymous visitors only access

Published Property Experience

No admin tables exposed.

---

###########################################################

TRIGGERS

###########################################################

Automatically update

updated_at

Increment version

Audit changes

Publish events

Refresh search indexes

Never use triggers for business logic.

Only infrastructure concerns.

---

###########################################################

SOFT DELETE POLICY

###########################################################

No destructive deletes.

Set

deleted_at

Records excluded from queries.

Hard delete only through scheduled retention jobs.

---

###########################################################

JSONB USAGE

###########################################################

Allowed only for

Analytics payloads

Configuration

Provider responses

Flexible metadata

Not for structured business entities.

---

###########################################################

ENUMS

###########################################################

Use PostgreSQL ENUMs for

Property Status

Knowledge Status

Verification Status

Lead Status

Subscription Status

Voice Status

Conversation Status

Avoid free-text state fields.

---

###########################################################

MIGRATION RULES

###########################################################

Every migration

Versioned

Reviewed

Rollback documented

Tested

Idempotent

Never edit old migrations.

Create new ones.

---

###########################################################

ENGINEERING RULES

###########################################################

Cursor SHALL

Normalize before denormalizing.

Create foreign keys.

Create indexes.

Use UUIDs.

Use timestamptz.

Enable RLS immediately.

Generate TypeScript types after schema changes.

Document every table.

Never bypass repositories.

---

###########################################################

SUCCESS

###########################################################

The database should support millions of conversations,

hundreds of thousands of properties,

enterprise organizations,

future verticals,

and decades of evolution without requiring a redesign of the

Digital Property Twin.