# PropertyPilot

## PRD-012

# Property Access Engine

Version: 1.0

Status

APPROVED

Priority

CRITICAL

####################################################################

VISION

####################################################################

Every visitor should be able to begin an AI-guided property experience

within five seconds.

No application.

No account.

No password.

No friction.

The Property Access Engine securely identifies the property,

creates a visitor session, configures the AI, and launches the

experience automatically.

The visitor should never think about technology.

####################################################################

SUPPORTED ACCESS METHODS

####################################################################

Version 1

• QR Code

• Direct URL

• Shared Link

Future

• NFC Tags

• Apple Wallet Pass

• Google Wallet Pass

• Digital Business Card

• Text Message

• Email Invitation

• Builder Kiosk

• Tablet Kiosk

• Open House Check-In

• Bluetooth Beacons

• Indoor Positioning

####################################################################

PROPERTY ACCESS TOKEN

####################################################################

Every published property receives

Property ID

↓

Public Access Token

↓

Secure Access URL

Example

propertypilot.app/p/7H92L4P

The internal Property UUID is NEVER exposed publicly.

Public tokens are

Random

Non-sequential

High entropy

Revocable

Regeneratable

###############################################################

TOKEN TYPES

###############################################################

Permanent

Used for printed signage.

Temporary

Expires automatically.

Open House

Valid only during configured dates.

Private Showing

One-time or time-limited.

Builder Demo

Reusable demonstration token.

QR codes reference tokens—not database IDs.

###############################################################

ENTRY FLOW

###############################################################

Visitor

↓

Scan QR

↓

Resolve Token

↓

Validate Property Status

↓

Create Visitor Session

↓

Determine Device

↓

Detect Language

↓

Load Property Twin

↓

Initialize AI

↓

Launch Welcome Screen

Total target time

<5 seconds

###############################################################

SESSION CREATION

###############################################################

Every visitor receives

Visitor Session ID

Anonymous ID

Conversation Context

Current Property

Preferred Language

Device Information

Analytics Session

No PII collected at this stage.

###############################################################

LANGUAGE DETECTION

###############################################################

Automatically detect browser language.

If supported

Launch in preferred language.

Otherwise

Use property default.

Visitor may change language at any time.

###############################################################

PROPERTY MODES

###############################################################

Available

Published

Preview

Draft

Archived

Private

Expired

Unavailable

Only Published properties allow public access.

###############################################################

PREVIEW MODE

###############################################################

Agents can preview exactly what buyers will experience.

Preview

Uses live AI

Uses live Property Twin

Watermarked

Analytics excluded by default

###############################################################

OPEN HOUSE MODE

###############################################################

Agent configures

Start Date

Start Time

End Date

End Time

During active window

Welcome screen changes

Example

"Welcome to today's Open House."

Special analytics enabled

Visitor counting

Peak traffic

Average duration

Concurrent sessions

###############################################################

PRIVATE SHOWING MODE

###############################################################

Generates

Unique access token

Optional expiration

Optional password

Optional realtor notification

Ideal for luxury listings.

###############################################################

WELCOME EXPERIENCE

###############################################################

Displays

Hero Image

Property Address

Agent Photo

Brokerage

PropertyPilot Branding

Estimated Tour Time

Start Tour

Browse Photos

Meet Your AI Guide

###############################################################

PROPERTY ACCESS SIGNAGE

###############################################################

Every property automatically receives

Letter

A4

Poster

Tabletop

Luxury

Minimal

Dark

Light

Custom Branding

Each design includes

QR

Logo

Property Address

Agent Branding

Simple Instructions

Accessibility Notice

###############################################################

SMART ENTRY

###############################################################

The engine detects

Mobile

Tablet

Desktop

Orientation

Screen Size

Accessibility Preferences

Dark Mode

Low Bandwidth

Experience adapts automatically.

###############################################################

SESSION RECOVERY

###############################################################

If browser refreshes

Reconnect visitor.

Restore conversation.

Restore current POI.

Restore AI context.

Restore transcript.

###############################################################

MULTIPLE VISITORS

###############################################################

Support

Hundreds of concurrent sessions.

Every visitor isolated.

No shared memory.

No cross-session leakage.

###############################################################

SECURITY

###############################################################

Never expose

UUIDs

Database IDs

Admin URLs

Internal APIs

Prompt Instructions

Knowledge Objects

Signed URLs for protected assets.

Rate limiting enabled.

Bot detection enabled.

###############################################################

ACCESS ANALYTICS

###############################################################

Track

QR Scans

Entry Time

Entry Method

Language

Device

Session Length

Bounce Rate

Completion Rate

Repeat Visits

Conversion Rate

Peak Hours

###############################################################

FAILOVER

###############################################################

If AI unavailable

Launch

Property Photos

Knowledge Summary

Brochure

Agent Contact

Never show

500 errors

Raw exceptions

Technical messages

###############################################################

ENGINEERING REQUIREMENTS

###############################################################

Property Access Engine is a dedicated service.

Token resolution isolated.

Session creation isolated.

Analytics isolated.

Authentication isolated.

No UI logic inside access layer.

###############################################################

SUCCESS

###############################################################

A visitor scans one QR code.

Within five seconds they are speaking with an AI that already knows the property, the current session, and how to guide the experience.

The technology should disappear.

The experience should begin.