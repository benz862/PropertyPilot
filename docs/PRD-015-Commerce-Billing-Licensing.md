# PropertyPilot

## PRD-015

# Commerce, Billing & Licensing Platform

Version 1.0

Status

APPROVED

Priority

MISSION CRITICAL

####################################################################

VISION

####################################################################

The Commerce Platform manages every commercial interaction

inside PropertyPilot.

Billing.

Subscriptions.

Trials.

Invoices.

Usage.

Licensing.

Enterprise accounts.

Brokerages.

Discounts.

Taxes.

Everything commercial exists here.

This service is completely isolated from the application.

####################################################################

PHILOSOPHY

####################################################################

A realtor should never think about billing.

Purchasing should feel effortless.

Managing subscriptions should be transparent.

Canceling should be simple.

Trust builds long-term customers.

####################################################################

PAYMENT PROVIDER

####################################################################

Version 1

Stripe

Future

Paddle

LemonSqueezy

Enterprise Invoicing

QuickBooks

NetSuite

####################################################################

SUBSCRIPTION MODEL

####################################################################

Plans

Starter

Professional

Brokerage

Enterprise

Every plan defined entirely in the database.

No pricing hardcoded.

No feature flags inside code.

Everything controlled from configuration.

####################################################################

PLAN STRUCTURE

####################################################################

Each plan contains

Name

Description

Monthly Price

Annual Price

Maximum Listings

Maximum Team Members

Maximum AI Minutes

Maximum Storage

Maximum Voice Notes

Maximum Generated Assets

Support Level

Included Integrations

Feature Access

Everything configurable.

####################################################################

FEATURE ENTITLEMENTS

####################################################################

Every feature has an entitlement.

Examples

Voice AI

Buyer Intelligence

CRM Integration

Analytics

Marketing Assets

Template Marketplace

Luxury Themes

Custom Branding

Enterprise API

Brokerage Dashboard

Instead of checking plan names

Check entitlements.

####################################################################

USAGE TRACKING

####################################################################

Track

Listings

Storage

Voice Minutes

AI Tokens

Generated PDFs

Generated Images

Generated Brochures

Visitors

Buyer Sessions

API Calls

Email Sends

Exports

Everything timestamped.

####################################################################

USAGE DASHBOARD

####################################################################

Display

Current Plan

Usage

Remaining Allowance

Projected Monthly Usage

Upgrade Suggestions

Recent Billing

Invoices

Payment Method

####################################################################

TRIALS

####################################################################

Support

14 Day Trial

30 Day Trial

Broker Demo

Enterprise Trial

Invite Trial

Trial rules configurable.

####################################################################

INVOICES

####################################################################

Display

Invoice Number

Date

Status

Amount

Taxes

Download PDF

Receipt

Payment Method

####################################################################

PAYMENT METHODS

####################################################################

Cards

Apple Pay

Google Pay

Bank Transfer (Enterprise)

Future

ACH

Wire

Purchase Orders

####################################################################

BROKERAGE ACCOUNTS

####################################################################

Brokerages may purchase

Seats

Shared Listings

Shared Templates

Shared Branding

Shared Analytics

Central Billing

Sub-accounts

####################################################################

LICENSE ENGINE

####################################################################

Every account receives

License ID

Plan

Entitlements

Status

Renewal Date

Usage Limits

Feature Flags

License checked server-side.

Never trust client.

####################################################################

DISCOUNTS

####################################################################

Support

Coupon Codes

Referral Credits

Brokerage Discounts

Seasonal Promotions

Launch Pricing

Lifetime Plans

Everything database driven.

####################################################################

REFUNDS

####################################################################

Support

Full Refund

Partial Refund

Manual Adjustment

Credit Balance

Audit Log

####################################################################

CANCELLATION

####################################################################

User may

Cancel

Pause

Resume

Downgrade

Upgrade

Prorated calculations handled by Stripe.

####################################################################

EMAILS

####################################################################

Automatically generated

Welcome

Trial Ending

Payment Success

Payment Failure

Invoice Available

Plan Changed

Usage Warning

Cancellation Confirmation

Renewal Reminder

Sent using Resend.

####################################################################

WEBHOOKS

####################################################################

Stripe Webhooks

Payment Succeeded

Payment Failed

Subscription Created

Subscription Updated

Subscription Cancelled

Invoice Paid

Refund Created

Every webhook

Verified

Idempotent

Logged

Retried

####################################################################

AUDIT LOG

####################################################################

Every billing event

Timestamp

User

Action

Amount

Result

Reference

Correlation ID

####################################################################

ADMIN CONTROLS

####################################################################

Grant Credits

Adjust Plans

Suspend Account

Issue Refund

Manual Invoice

Reset Usage

Everything logged.

####################################################################

SECURITY

####################################################################

PCI handled by Stripe.

No card data stored.

Webhook signatures verified.

Encrypted customer IDs.

Secrets stored server-side.

####################################################################

ENGINEERING REQUIREMENTS

####################################################################

Commerce Platform is an independent microservice.

Stripe SDK isolated.

No billing logic inside UI.

No billing logic inside AI.

Every entitlement server validated.

####################################################################

SUCCESS

####################################################################

Every customer understands

What they are paying for.

What they have used.

What they have remaining.

Billing never becomes a support issue.

Commerce quietly powers the platform without becoming the user's focus.