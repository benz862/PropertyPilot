# PropertyPilot

# ENG-006

# UI Design System

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the complete visual language of PropertyPilot.

Every screen, component, interaction, animation and layout must

follow this system.

Consistency is mandatory.

Every page should immediately feel like PropertyPilot.

---

# DESIGN PHILOSOPHY

PropertyPilot is a professional business platform.

It is not flashy.

It is not playful.

It is not cluttered.

The interface should communicate

Trust

Confidence

Intelligence

Organization

Precision

Calmness

Every element must have a purpose.

---

# DESIGN PRINCIPLES

Reduce cognitive load.

Reward progress.

Guide the eye.

Surface important information.

Hide complexity.

Never overwhelm.

Information should breathe.

Whitespace is a feature.

---

# VISUAL PERSONALITY

Professional

Modern

Elegant

Minimal

Premium

Warm

Approachable

Confident

---

# COLOR SYSTEM

PropertyPilot Colors

Primary

#17394B

Secondary

#E3B549

Success

#16A34A

Warning

#D97706

Danger

#DC2626

Information

#2563EB

Neutral

Slate Scale

50

100

200

300

400

500

600

700

800

900

No hardcoded colors.

Everything references design tokens.

---

# SEMANTIC COLORS

Primary Action

Secondary Action

Muted

Border

Surface

Background

Foreground

Card

Overlay

Focus

Disabled

Hover

Selected

Success

Warning

Danger

Every state configurable.

---

# TYPOGRAPHY

Font

Inter

Fallback

System UI

Weights

400

500

600

700

800

Sizes

12

14

16

18

20

24

30

36

48

64

Typography scale defined once.

---

# SPACING SYSTEM

4px base grid.

Spacing

4

8

12

16

20

24

32

40

48

64

80

96

Never arbitrary spacing.

---

# BORDER RADIUS

Small

6px

Medium

10px

Large

16px

XL

24px

Full

9999px

---

# SHADOWS

xs

sm

md

lg

xl

2xl

Only tokenized shadows.

---

# ICONOGRAPHY

Lucide React

24px default

16px compact

32px hero

No emoji.

No decorative icons.

Icons support meaning.

---

# BUTTONS

Variants

Primary

Secondary

Outline

Ghost

Danger

Success

Link

Sizes

Small

Medium

Large

XL

States

Default

Hover

Focus

Disabled

Loading

Pressed

---

# INPUTS

Text

Textarea

Email

Phone

Search

Currency

Date

Time

Select

Autocomplete

Combobox

Checkbox

Radio

Toggle

File Upload

Voice Input

Every input

Label

Help Text

Validation

Error

Disabled

Required

---

# CARDS

Primary Card

Analytics Card

Recommendation Card

Knowledge Card

Lead Card

Property Card

Conversation Card

Metric Card

Every card

Header

Body

Footer

Actions

---

# TABLES

Sortable

Filterable

Responsive

Sticky Header

Pagination

Bulk Selection

Row Actions

Export

Virtualization

---

# BADGES

Neutral

Primary

Success

Warning

Danger

Information

Outline

Sizes

Small

Medium

---

# STATUS INDICATORS

Draft

Published

Archived

Pending

Verified

Rejected

Approved

Active

Inactive

Connected

Disconnected

Always consistent.

---

# ALERTS

Success

Warning

Error

Information

System

Dismissible

Persistent

Inline

Toast

---

# MODALS

Maximum width tokens.

Keyboard support.

Escape closes.

Focus trapped.

Background locked.

Never nest modals.

---

# DRAWERS

Desktop

Right Panel

Mobile

Bottom Sheet

Persistent

Inspector Panel

---

# TABS

Underline style.

Horizontal.

Scrollable.

Keyboard accessible.

---

# BREADCRUMBS

Always visible.

Clickable.

Responsive.

---

# SIDEBAR

Collapsible.

Remember state.

Supports

Organizations

Properties

Marketing

Analytics

Admin

---

# DASHBOARD WIDGETS

Every widget

Title

Description

Primary Metric

Trend

Actions

Refresh

Empty State

---

# PROPERTY BUILDER UI

Stepper

Progress

Validation

Autosave

Suggestions

Completion Score

Knowledge Health

Publishing Readiness

This is the primary workflow of the application.

---

# VOICE EXPERIENCE

Dedicated design language.

Microphone

Waveform

Realtime Transcript

Connection Status

Speaking Indicator

Thinking Indicator

Latency

Interrupt

Conversation History

Unknown Answer Indicator

No browser default audio controls.

---

# KNOWLEDGE OBJECT CARD

Displays

Name

Category

Verification

Confidence

Relationships

Documents

Photos

Timeline

Health

Actions

This becomes the primary visualization of property knowledge.

---

# BUYER INTELLIGENCE CARD

Displays

Buyer Interest

Concern

Intent

Questions

Conversation Summary

Recommended Follow-up

Confidence

---

# PROPERTY HEALTH GAUGE

Single circular visualization.

Displays

Knowledge

Photos

Voice

Marketing

Verification

Overall Score

Clickable.

---

# QR EXPERIENCE

Landing page

Large Start Button

Property Hero Image

Agent

Estimated Tour Time

Voice First

Large touch targets.

---

# ANIMATIONS

Use Framer Motion.

Purposeful only.

Examples

Fade

Slide

Expand

Collapse

Count Up

Skeleton

Page Transition

Micro Interaction

Respect reduced motion preferences.

---

# EMPTY STATES

Every page includes

Illustration

Title

Explanation

Primary Action

Help Link

Never show empty white screens.

---

# LOADING STATES

Skeletons

Streaming

Optimistic Updates

Progress Bars

Incremental Loading

No blocking spinners unless unavoidable.

---

# RESPONSIVE DESIGN

Breakpoints

Mobile

Tablet

Laptop

Desktop

Wide

Every component responsive.

No horizontal scrolling.

---

# ACCESSIBILITY

WCAG AA

Keyboard

Screen Readers

High Contrast

Reduced Motion

Touch Targets

Visible Focus

Accessible Forms

ARIA labels

---

# DARK MODE

Complete support.

Not inverted colors.

Designed independently.

Every component reviewed.

---

# BRAND CUSTOMIZATION

Brokerages may customize

Logo

Primary Color

Secondary Color

Typography (approved list)

PDF Theme

Email Theme

Sign Templates

Core layout remains consistent.

---

# COMPONENT DOCUMENTATION

Every reusable component includes

Purpose

Props

Examples

Accessibility Notes

Variants

Usage Guidelines

Do not create undocumented shared components.

---

# ENGINEERING RULES

Cursor SHALL

Never hardcode colors.

Never hardcode spacing.

Use design tokens.

Use shadcn/ui as the base layer.

Extend components rather than replacing them.

Create reusable variants.

Follow accessibility requirements.

Optimize for touch and desktop equally.

Avoid visual clutter.

Prefer whitespace over borders.

Maintain consistent spacing throughout the application.

---

# SUCCESS

A user should recognize PropertyPilot immediately from its

visual language.

Every page should communicate professionalism, trust,

and clarity.

The interface should disappear behind the task.

Users should spend their time understanding properties,

not understanding software.