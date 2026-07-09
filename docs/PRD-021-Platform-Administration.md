# PropertyPilot

## PRD-021

# Platform Administration

Version 1.0

Status

APPROVED

Priority

PLATFORM

####################################################################

VISION

####################################################################

The Platform Administration Console is the operational control

center for PropertyPilot.

It is used only by authorized PropertyPilot staff.

It is never exposed to customers.

Its purpose is to monitor platform health, manage customers,

investigate issues, support users and operate the business.

####################################################################

ADMIN PHILOSOPHY

####################################################################

Everything important should be visible.

Nothing should require direct database access.

Every administrative action must be logged.

Every action must be reversible when possible.

####################################################################

ADMIN ROLES

####################################################################

Platform Owner

Executive

Operations

Engineering

Customer Success

Sales

Finance

Support

Compliance

Read Only

Every role has configurable permissions.

####################################################################

ADMIN DASHBOARD

####################################################################

Displays

Platform Health

System Status

Current Incidents

Active Users

Active Organizations

Active Properties

Today's Tours

Today's Leads

Today's AI Conversations

Revenue Snapshot

Support Queue

Unread Alerts

Scheduled Maintenance

####################################################################

CUSTOMER MANAGEMENT

####################################################################

Search

Organizations

Brokerages

Agents

Users

View

Subscription

Usage

Properties

Billing

Activity

Support History

API Keys

Security Events

Suspend

Restore

Transfer Ownership

Merge Accounts

####################################################################

PROPERTY MANAGEMENT

####################################################################

Search

Property

MLS

Address

Agent

Organization

View

Property Health

Knowledge Health

Publishing Status

Voice Configuration

Analytics

Conversation Logs

Documents

Audit History

Administrative tools

Archive

Restore

Force Regeneration

Reprocess AI

Repair Search Index

####################################################################

AI OPERATIONS

####################################################################

Monitor

Realtime Conversations

Model Usage

Latency

Costs

Unknown Question Rate

Prompt Versions

Knowledge Retrieval

Conversation Quality

Fallback Rate

AI Incidents

####################################################################

INCIDENT CENTER

####################################################################

Every incident tracked.

Severity

Critical

High

Medium

Low

Incident contains

Timeline

Affected Services

Affected Customers

Status

Root Cause

Resolution

Postmortem

####################################################################

SUPPORT CENTER

####################################################################

View

Customer Tickets

Conversation History

Recent Errors

Recent AI Sessions

Billing Events

CRM Status

Recent Deployments

Support tools

Impersonate User (audited)

Generate Diagnostic Report

Resend Emails

Retry Jobs

####################################################################

REVENUE DASHBOARD

####################################################################

Monthly Recurring Revenue

Annual Recurring Revenue

Customer Growth

Churn

Trials

Conversions

Average Revenue Per Account

Enterprise Revenue

Property Credits

Usage Trends

####################################################################

USAGE MONITORING

####################################################################

Platform totals

Properties

Voice Minutes

AI Tokens

Storage

Generated Assets

Conversations

Leads

API Calls

Email Sends

Top Customers

Fastest Growing Accounts

####################################################################

SYSTEM HEALTH

####################################################################

Realtime status

Authentication

Database

Storage

Realtime Voice

OpenAI

Stripe

GoHighLevel

Resend

Queues

Workers

Backups

Search

Every service has

Health

Latency

Errors

Availability

####################################################################

JOB CENTER

####################################################################

Monitor

Asset Generation

Document Parsing

Photo Analysis

Voice Processing

Knowledge Extraction

CRM Sync

Webhook Delivery

Retry Queue

Dead Letter Queue

Manual retry supported.

####################################################################

CONFIGURATION

####################################################################

Manage

Feature Flags

Platform Settings

Email Templates

Voice Providers

AI Providers

Rate Limits

Maintenance Windows

System Announcements

####################################################################

AUDIT CENTER

####################################################################

Every administrative action stored.

Who

What

When

Why

Result

Previous Value

New Value

IP Address

Correlation ID

Immutable.

####################################################################

SECURITY CENTER

####################################################################

View

Failed Logins

Suspicious Activity

API Key Usage

Permission Changes

MFA Status

Organization Security

Blocked IPs

Threat Alerts

####################################################################

COMMUNICATION CENTER

####################################################################

Send

Platform Announcement

Maintenance Notice

Security Notice

Billing Notice

Target

All Customers

Organizations

Plans

Regions

Specific Users

####################################################################

FEATURE FLAGS

####################################################################

Gradual rollout

Examples

New AI Model

New Voice Provider

New UI

Beta Features

Internal Testing

Regional Release

Kill Switch

Every feature independently controllable.

####################################################################

BACKUP & RECOVERY

####################################################################

View

Backup Status

Restore Points

Recovery Tests

Retention

Storage Health

Manual restore authorization required.

####################################################################

ENGINEERING REQUIREMENTS

####################################################################

Admin Console isolated from customer application.

Separate authentication.

Separate authorization.

Every action audited.

Read operations optimized.

No direct SQL interface.

####################################################################

SUCCESS

####################################################################

PropertyPilot staff should be able to operate the entire

platform from the Administration Console without requiring

engineering intervention for routine operational tasks.