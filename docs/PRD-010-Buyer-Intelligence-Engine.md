# PropertyPilot

## PRD-010

# Buyer Intelligence Engine

Version: 1.0

Status

APPROVED

Priority

MISSION CRITICAL

###############################################################

VISION

###############################################################

PropertyPilot does not collect leads.

PropertyPilot builds Buyer Intelligence.

By the time a visitor finishes a tour, the realtor should know

what they liked,

what they disliked,

what they asked,

what they never looked at,

and how likely they are to request a showing.

The goal is to help the realtor have a better first conversation.

###############################################################

BUYER INTELLIGENCE PROFILE

###############################################################

Every visitor session generates a Buyer Intelligence Profile.

The profile exists even if the visitor never submits their contact

information.

Personally identifiable information (PII) is stored only after the

visitor provides it.

Anonymous sessions remain anonymous.

###############################################################

BUYER PROFILE STRUCTURE

###############################################################

Session Information

Session ID

Date

Start Time

End Time

Duration

Device

Language

Approximate Location (city/state only)

QR Source

Property

###############################################################

ENGAGEMENT METRICS

###############################################################

Track

Tour Started

Tour Completed

POIs Viewed

POIs Skipped

Time Per POI

Questions Asked

Voice Interactions

Photo Views

Document Views

Feature Sheet Requests

Brochure Requests

Showing Requests

Exit Point

###############################################################

BUYER INTEREST ENGINE

###############################################################

The AI continuously builds an interest profile.

Examples

Workshop

Home Office

Kitchen

Garage

Schools

Backyard

Pool

Luxury Finishes

Accessibility

Storage

Energy Efficiency

Smart Home

Investment Potential

Pet Friendly

Each interest contains

Interest Name

Confidence Score

Evidence

Supporting Questions

Timestamp

###############################################################

BUYER CONCERN ENGINE

###############################################################

The AI identifies concerns without making assumptions.

Examples

Taxes

Roof Age

HVAC

HOA

Commute

Noise

Yard Size

Maintenance

Accessibility

Storage

Price

Every concern stores

Concern

Confidence

Conversation Evidence

Frequency

Resolution Status

###############################################################

BUYER INTENT ENGINE

###############################################################

Intent Levels

Exploring

Interested

Very Interested

Ready to Act

Intent is calculated using multiple signals.

Examples

Tour Completion

Showing Request

Brochure Download

Repeat Questions

Property Comparison

Time Spent

Conversation Depth

Follow-up Requests

The algorithm must remain configurable.

No hard-coded scoring.

###############################################################

AI CONVERSATION SUMMARY

###############################################################

After every tour the AI generates

Executive Summary

Example

The visitor spent approximately 31 minutes exploring the property.

Most attention was given to the Flex Space, Kitchen and Backyard.

The visitor asked detailed questions about electrical service,

roof age and heating systems.

No significant objections were detected.

The visitor requested the brochure and expressed interest in

scheduling another visit.

###############################################################

BUYER TIMELINE

###############################################################

Chronological timeline

QR Scan

↓

Welcome

↓

Kitchen

↓

Garage

↓

Flex Space

↓

Questions

↓

Brochure

↓

Lead Capture

↓

Exit

Everything timestamped.

###############################################################

UNANSWERED QUESTIONS

###############################################################

Every unanswered question becomes

Question

Reason

Knowledge Gap

Suggested Action

Example

"What is the insulation R-value?"

Knowledge Missing

Recommend

Add insulation specifications.

###############################################################

BUYER SENTIMENT

###############################################################

The AI estimates

Positive

Neutral

Concerned

Excited

Uncertain

Sentiment must never be shown to the buyer.

Used only for realtor insights.

###############################################################

LEAD CAPTURE EXPERIENCE

###############################################################

Never force.

Never interrupt.

Only after value has been delivered.

Example

"I can email you the complete property guide if you'd like."

If accepted

Collect

First Name

Last Name

Email

Phone

Preferred Contact Method

Buying Timeline

Already Working With Realtor

Consent

###############################################################

REALTOR REPORT

###############################################################

Every qualified lead generates

Buyer Summary

Interest Summary

Concern Summary

Conversation Summary

Top Questions

Recommended Follow-up

Suggested Talking Points

Recommended Documents

AI Confidence

###############################################################

FOLLOW-UP RECOMMENDATIONS

###############################################################

Examples

Send Flex Space Brochure

Schedule Workshop Demonstration

Provide Roof Documentation

Send HVAC Maintenance Records

Discuss School District

Recommend Second Showing

The AI explains why each recommendation was generated.

###############################################################

GOHIGHLEVEL INTEGRATION

###############################################################

Push

Contact

Conversation Summary

Interest Tags

Concern Tags

Intent Score

Property Viewed

Brochure Sent

Showing Requested

Custom Fields

Suggested Pipeline Stage

Never overwrite existing CRM information.

Only append new activity.

###############################################################

PRIVACY

###############################################################

Anonymous sessions remain anonymous.

No personally identifiable information is stored without user consent.

Visitors may request deletion of their information.

All data retention periods must be configurable.

###############################################################

AI LEARNING

###############################################################

The AI never learns directly from conversations.

Instead

Aggregate trends are surfaced.

Example

Across 27 visitors

Roof asked about 18 times.

Garage asked about 15 times.

Kitchen asked about 12 times.

Recommend improving those Knowledge Objects.

###############################################################

ENGINEERING REQUIREMENTS

###############################################################

Buyer Intelligence is its own microservice.

No business logic inside UI components.

Every score configurable.

Every recommendation explainable.

Every summary reproducible.

Every AI output logged.

###############################################################

SUCCESS

###############################################################

The realtor should finish reading a Buyer Intelligence Report in under two minutes and immediately know:

Who this buyer is.

What matters to them.

What concerns they have.

How serious they appear to be.

What to discuss next.

The first follow-up call should feel informed rather than exploratory.