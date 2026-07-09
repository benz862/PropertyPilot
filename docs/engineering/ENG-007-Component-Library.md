# PropertyPilot

# ENG-007

# Component Library

Version: 1.0

Status: LOCKED

Owner: PropertyPilot Engineering

---

# PURPOSE

This document defines every reusable React component used

throughout PropertyPilot.

Every shared component must be documented here.

If a component is used in more than one feature, it belongs in

the Component Library.

The objective is consistency, maintainability, accessibility,

and reuse.

---

# COMPONENT PHILOSOPHY

Components are building blocks.

They should be

Reusable

Predictable

Composable

Accessible

Testable

Small

Documented

No component should contain business logic.

Components receive data.

Services provide data.

---

# COMPONENT DIRECTORY

/components

```

components/

ui/

layout/

navigation/

forms/

voice/

property/

knowledge/

analytics/

marketing/

crm/

buyer/

admin/

feedback/

charts/

shared/

```

---

# COMPONENT STANDARDS

Every shared component includes

TypeScript Props

JSDoc Comments

Accessibility

Storybook Story (Future)

Unit Tests

Loading State

Error State

Empty State

Dark Mode Support

Responsive Design

---

# LAYOUT COMPONENTS

AppShell

DashboardLayout

PropertyLayout

AdminLayout

AuthLayout

PublicLayout

SplitLayout

CenteredLayout

Sidebar

TopNavigation

BottomNavigation

Breadcrumbs

PageHeader

SectionHeader

StickyFooter

---

# UI COMPONENTS

Button

IconButton

Card

Badge

Avatar

Tooltip

Popover

Dropdown

Accordion

Tabs

Dialog

Drawer

Toast

Alert

Progress

Skeleton

Separator

ScrollArea

Pagination

CommandPalette

---

# FORM COMPONENTS

TextInput

Textarea

SearchInput

CurrencyInput

PhoneInput

EmailInput

DatePicker

TimePicker

Combobox

Select

Checkbox

RadioGroup

Switch

Slider

TagsInput

FileUploader

PhotoUploader

VoiceUploader

DocumentUploader

AutosaveIndicator

ValidationSummary

---

# PROPERTY COMPONENTS

PropertyCard

PropertyHero

PropertySummary

PropertyTimeline

PropertyHealthGauge

PropertyMap

PropertyStats

PropertyStatusBadge

PropertyGallery

PropertyAddressCard

PropertyOverview

PropertyQuickActions

PropertyChecklist

PropertyPublishPanel

PropertyCompletion

PropertyHeader

---

# PROPERTY BUILDER COMPONENTS

BuilderWizard

BuilderSidebar

BuilderProgress

BuilderChecklist

BuilderSuggestions

BuilderStep

BuilderReview

BuilderStatus

BuilderSummary

KnowledgeSuggestions

PhotoAnalysisCard

DocumentAnalysisCard

VoiceAnalysisCard

TimelineBuilder

---

# KNOWLEDGE COMPONENTS

KnowledgeCard

KnowledgeObjectCard

KnowledgeFactCard

KnowledgeRelationshipGraph

KnowledgeTimeline

KnowledgeHealth

KnowledgeConfidence

KnowledgeVersion

KnowledgeApprovalPanel

KnowledgeConflictCard

KnowledgeSearch

KnowledgeExplorer

---

# VOICE COMPONENTS

VoiceMic

VoiceWaveform

VoiceRecorder

VoicePlayer

VoiceTranscript

VoiceConversation

VoiceIndicator

VoiceLatency

VoiceConnectionStatus

VoiceInterruptButton

RealtimeConversation

ConversationHistory

ThinkingIndicator

ListeningIndicator

---

# BUYER COMPONENTS

BuyerCard

BuyerSessionCard

BuyerInterestCard

BuyerConcernCard

BuyerIntentCard

BuyerTimeline

BuyerJourney

BuyerSummary

LeadCard

LeadStatus

LeadActions

FollowUpSuggestions

ConversationSummary

---

# MARKETING COMPONENTS

BrochurePreview

PDFPreview

SignPreview

QRCodeCard

SocialPreview

AssetGallery

AssetVersion

BrandTheme

TemplateSelector

GeneratedAssetCard

MarketingChecklist

---

# ANALYTICS COMPONENTS

MetricCard

TrendCard

ComparisonCard

InsightCard

RecommendationCard

ActivityFeed

TimelineChart

PropertyBenchmark

EngagementHeatmap

QuestionFrequencyChart

LeadConversionChart

PropertyHealthTrend

OrganizationDashboard

---

# CRM COMPONENTS

CRMConnection

CRMStatus

SyncStatus

PipelineCard

TaskCard

WorkflowCard

CalendarPreview

AppointmentCard

TagEditor

FieldMapping

WebhookStatus

---

# ADMIN COMPONENTS

SystemHealth

JobQueue

DeploymentStatus

FeatureFlags

SupportPanel

OrganizationCard

AuditViewer

SecurityEvents

PlatformMetrics

IncidentTimeline

CustomerOverview

PlatformStatus

---

# CHART COMPONENTS

LineChart

BarChart

AreaChart

PieChart

RadarChart

HeatMap

Gauge

ProgressRing

Sparkline

DistributionChart

ComparisonChart

TimelineChart

---

# FEEDBACK COMPONENTS

SuccessBanner

WarningBanner

ErrorBanner

EmptyState

LoadingState

RetryPanel

ConfirmationDialog

DeleteDialog

OfflineBanner

MaintenanceBanner

UpgradePrompt

---

# SEARCH COMPONENTS

GlobalSearch

PropertySearch

KnowledgeSearch

LeadSearch

DocumentSearch

CommandPalette

RecentSearches

SavedSearches

SearchResults

---

# NAVIGATION COMPONENTS

SidebarNavigation

MobileNavigation

QuickActions

ContextMenu

UserMenu

OrganizationSwitcher

PropertySwitcher

Breadcrumbs

CommandMenu

NotificationsPanel

---

# COMPONENT API STANDARD

Every component exposes

Props

Events

Slots (where applicable)

Variants

Size

State

Accessibility

Example

```typescript

interface PropertyCardProps {

  property: Property;

  variant?: "compact" | "standard" | "featured";

  selectable?: boolean;

  selected?: boolean;

  loading?: boolean;

  onSelect?: (id: string) => void;

}

```

---

# VARIANTS

Every reusable component supports variants.

Example

Button

Primary

Secondary

Outline

Ghost

Danger

Success

Large

Small

Loading

Disabled

Never create duplicate buttons.

---

# COMPOSITION RULES

Prefer

```

<Card>

<CardHeader>

<CardContent>

<CardFooter>

</Card>

```

instead of large monolithic components.

Composition over inheritance.

---

# ACCESSIBILITY

Every component

Keyboard Accessible

Screen Reader Friendly

ARIA Labels

Focus Visible

Reduced Motion Support

Touch Friendly

No exceptions.

---

# RESPONSIVENESS

Every component supports

Mobile

Tablet

Desktop

Wide Screen

No desktop-only components.

---

# PERFORMANCE

Memoize only when measurable.

Lazy load heavy components.

Virtualize large lists.

Avoid unnecessary renders.

Prefer server rendering.

---

# TESTING

Every shared component includes

Rendering Tests

Interaction Tests

Accessibility Tests

Variant Tests

Snapshot Tests (where appropriate)

---

# DOCUMENTATION

Each component includes

Purpose

Props

Example

Accessibility Notes

Variants

Usage

Do

Don't

---

# DEPRECATION

Components are never removed immediately.

Mark

@deprecated

Provide migration path.

Remove only in major versions.

---

# ENGINEERING RULES

Cursor SHALL

Reuse before creating.

Search existing components first.

Extend existing variants.

Do not duplicate UI patterns.

Keep components under 250 lines where practical.

Extract subcomponents when complexity increases.

Separate presentation from behavior.

Prefer composition.

Keep props strongly typed.

Document public APIs.

---

# SUCCESS

The Component Library should enable developers to build

new features rapidly while maintaining a consistent,

professional and accessible user experience.

Every new screen should primarily consist of existing,

well-tested components assembled into new workflows

rather than newly created UI elements.