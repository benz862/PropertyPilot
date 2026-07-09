# PropertyPilot

# ENG-009

# Coding Standards & Development Guidelines

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines the coding standards for every line of code

written for PropertyPilot.

These standards apply equally to

Human developers

AI coding assistants

Cursor

Codex

Future contributors

Consistency is mandatory.

---

# ENGINEERING PHILOSOPHY

Write code for the next engineer.

Readable code beats clever code.

Explicit beats implicit.

Maintainability beats brevity.

The simplest correct solution is preferred.

---

# GENERAL PRINCIPLES

Single Responsibility

Composition over Inheritance

Dependency Injection

Immutability where practical

Fail Fast

Defensive Programming

Strong Typing

Explicit Naming

No Hidden Side Effects

---

# TYPESCRIPT

Strict Mode

Enabled

No implicit any

Never disabled

Prefer interfaces

Use type aliases for unions

Prefer readonly

Avoid enums unless appropriate

No ts-ignore without documented approval

Maximum use of inferred types only when readability is improved.

---

# FILE ORGANIZATION

One primary export per file.

Small focused files.

Avoid utility dumping grounds.

Maximum file size

500 lines

Preferred

250 lines

Maximum function size

75 lines

Preferred

30 lines

Refactor when limits exceeded.

---

# FOLDER ORGANIZATION

Every feature contains

components

hooks

schemas

services

repositories

types

utils

tests

constants

No miscellaneous folders.

---

# NAMING

Variables

camelCase

Functions

camelCase

Components

PascalCase

Interfaces

PascalCase

Types

PascalCase

Files

PascalCase for components

camelCase for utilities

Folders

kebab-case

---

# FUNCTION DESIGN

Functions should

Perform one task

Return predictable values

Avoid mutation

Be independently testable

Avoid nested conditionals

Prefer early returns

Maximum nesting depth

3

---

# COMMENTS

Comment

Why

Not

What

Avoid obvious comments.

Document business rules.

Use JSDoc on exported functions.

---

# IMPORTS

Order

Node

Third-party

Internal

Relative

Alphabetical within groups.

No circular dependencies.

---

# ERROR HANDLING

Never swallow exceptions.

Every error logged.

Every async call handled.

User-friendly errors.

Developer diagnostics logged.

Correlation IDs propagated.

---

# ASYNC

Use async/await.

Avoid promise chains.

Handle timeouts.

Handle cancellation.

Support retries where appropriate.

---

# REACT

Server Components first.

Client Components only when required.

Small components.

Composable layouts.

Custom hooks for reusable logic.

No business logic inside components.

---

# HOOKS

Hooks manage

UI behavior

Server state

Browser APIs

Never business rules.

Prefix

use

Example

useVoiceSession

---

# SERVICES

Services own business logic.

Examples

PropertyService

KnowledgeService

VoiceService

MarketingService

Services never render UI.

---

# REPOSITORIES

Repositories

Own database access.

Return domain models.

Never expose raw SQL.

Never contain business logic.

---

# API CLIENTS

Typed

Centralized

Reusable

No fetch scattered across components.

---

# VALIDATION

Client

Zod

Server

Zod

Business

Services

Never trust client validation.

---

# CONSTANTS

Magic numbers prohibited.

Centralize

Limits

Timeouts

Defaults

Configuration

---

# CONFIGURATION

Environment variables

Validated at startup.

Configuration objects

Strongly typed.

No hardcoded URLs.

---

# LOGGING

Structured.

Never console.log in production.

Levels

Debug

Info

Warn

Error

Critical

Include

Timestamp

Correlation ID

User

Property

Organization

---

# SECURITY

Escape user input.

Validate uploads.

Never expose secrets.

Never bypass authorization.

Never disable Row Level Security.

Sanitize HTML.

Protect against XSS.

Protect against CSRF.

Protect against injection.

---

# PERFORMANCE

Avoid unnecessary renders.

Lazy load heavy modules.

Memoize only with evidence.

Virtualize long lists.

Optimize images.

Stream where appropriate.

---

# ACCESSIBILITY

Keyboard support.

Screen readers.

ARIA labels.

Visible focus.

Touch targets.

Reduced motion.

No accessibility regressions.

---

# TESTING

Every business rule

Unit test.

Every service

Integration test.

Every API

Contract test.

Every workflow

End-to-end test.

Bug fixes require regression tests.

---

# GIT

Small commits.

Descriptive messages.

Conventional commits.

Feature branches.

Reviewed pull requests.

Protected main branch.

---

# PULL REQUESTS

Checklist

Build passes

Tests pass

Lint passes

Types pass

Accessibility reviewed

Security reviewed

Documentation updated

Reviewer approval

---

# CODE REVIEWS

Review for

Correctness

Readability

Architecture

Performance

Security

Accessibility

Maintainability

Not personal preference.

---

# DEPRECATION

Mark

@deprecated

Provide migration path.

Remove only in major releases.

---

# THIRD-PARTY LIBRARIES

Before adding

Evaluate maintenance.

Evaluate security.

Evaluate license.

Evaluate bundle size.

Prefer fewer dependencies.

---

# AI GENERATED CODE

AI output is a draft.

Every generated file

Reviewed

Tested

Refactored

Documented

Never merge AI-generated code without review.

---

# DOCUMENTATION

Public APIs documented.

Services documented.

Complex algorithms documented.

Architecture decisions recorded.

Keep documentation synchronized.

---

# ENGINEERING RULES

Cursor SHALL

Never duplicate logic.

Never bypass services.

Never access the database from UI components.

Never suppress compiler errors.

Never ignore lint errors.

Always use strict typing.

Always create reusable abstractions.

Always write readable code.

Always prioritize maintainability.

Always update tests.

Always update documentation.

Always assume the code will still be maintained five years from now.

---

# SUCCESS

A new engineer should be able to read any file in the project and

understand its purpose within minutes.

The codebase should remain consistent regardless of who—or what—

writes the code.

PropertyPilot should be recognized not only for its features but for

the quality, clarity, and longevity of its engineering.