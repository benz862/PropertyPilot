# PropertyPilot

# ENG-013

# Database Specification

Version 1.0

Status

LOCKED

Owner

PropertyPilot Engineering

####################################################################

PURPOSE

####################################################################

This document defines the complete PostgreSQL schema used by

PropertyPilot.

Every table in this document is production ready.

This specification defines

• Tables

• Columns

• Types

• Constraints

• Indexes

• RLS Policies

• Relationships

• Triggers

• Repository Contracts

• TypeScript Interfaces

No schema changes occur outside this document.

####################################################################

DATABASE STANDARDS

####################################################################

Primary Key

UUID v7

Audit Fields

created_at

updated_at

created_by

updated_by

deleted_at

version

Soft Deletes

Enabled

Row Level Security

Enabled

Foreign Keys

Required

Indexes

Reviewed

Everything uses timestamptz.

####################################################################

CHAPTER 1

####################################################################

IDENTITY DOMAIN

The Identity Domain manages

Authentication

Organizations

Users

Offices

Teams

Permissions

API Keys

Sessions

Security

####################################################################

TABLE

####################################################################

profiles

####################################################################

PURPOSE

####################################################################

Represents every authenticated user inside PropertyPilot.

Every authenticated action originates from a Profile.

A Profile belongs to one or more Organizations.

Profiles do NOT store authentication credentials.

Authentication is handled by Supabase Auth.

####################################################################

TABLE NAME

####################################################################

profiles

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

References

auth.users(id)

ON DELETE CASCADE

####################################################################

COLUMNS

####################################################################

id

UUID

NOT NULL

PRIMARY KEY

------------------------------------------------------------

email

TEXT

NOT NULL

UNIQUE

------------------------------------------------------------

first_name

TEXT

NOT NULL

Maximum

100 characters

------------------------------------------------------------

last_name

TEXT

NOT NULL

Maximum

100 characters

------------------------------------------------------------

display_name

TEXT

Generated

Example

John Smith

------------------------------------------------------------

phone

TEXT

Nullable

E164 format

------------------------------------------------------------

avatar_url

TEXT

Nullable

Supabase Storage URL

------------------------------------------------------------

job_title

TEXT

Nullable

Examples

Realtor

Broker

Assistant

Administrator

------------------------------------------------------------

timezone

TEXT

Default

America/New_York

IANA Timezone

------------------------------------------------------------

language

TEXT

Default

en-US

------------------------------------------------------------

status

profile_status_enum

Default

ACTIVE

------------------------------------------------------------

last_login_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

email_verified

BOOLEAN

Default TRUE

Managed by Supabase

------------------------------------------------------------

onboarding_completed

BOOLEAN

Default FALSE

------------------------------------------------------------

marketing_opt_in

BOOLEAN

Default FALSE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

------------------------------------------------------------

updated_by

UUID

Nullable

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PK

id

UNIQUE

email

INDEX

status

INDEX

last_login_at

INDEX

created_at

####################################################################

CHECK CONSTRAINTS

####################################################################

Email

Valid format

First Name

Length > 0

Last Name

Length > 0

Version >=1

####################################################################

FOREIGN KEYS

####################################################################

id

↓

[auth.users.id](http://auth.users.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Policy

User can view own profile.

User can update own profile.

Organization Admin

Read

Platform Admin

Full Access

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Before Update

updated_at = now()

Increment version

Audit profile updates

####################################################################

RELATED TABLES

####################################################################

organization_members

user_roles

api_keys

voice_profiles

audit_log

notifications

####################################################################

TYPESCRIPT

####################################################################

interface Profile {

id:string;

email:string;

firstName:string;

lastName:string;

displayName:string;

phone?:string;

avatarUrl?:string;

jobTitle?:string;

timezone:string;

language:string;

status:ProfileStatus;

lastLoginAt?:Date;

emailVerified:boolean;

onboardingCompleted:boolean;

marketingOptIn:boolean;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

REPOSITORY

####################################################################

ProfileRepository

Methods

create()

update()

findById()

findByEmail()

list()

archive()

restore()

exists()

search()

####################################################################

EVENTS

####################################################################

ProfileCreated

ProfileUpdated

ProfileArchived

ProfileRestored

ProfileDeleted

####################################################################

SUCCESS

####################################################################

The Profiles table becomes the canonical identity record

throughout PropertyPilot.

Every authenticated feature ultimately references [profiles.id](http://profiles.id).



####################################################################

TABLE

####################################################################

organizations

####################################################################

PURPOSE

####################################################################

The Organizations table represents the highest customer entity

within PropertyPilot.

An Organization may represent

• Independent Realtor

• Real Estate Brokerage

• Property Management Company

• Commercial Real Estate Firm

• Enterprise Customer

Every property, user, asset, subscription, report and AI interaction

belongs to exactly one Organization.

Organizations provide complete data isolation.

This table is one of the most important tables in the platform.

####################################################################

TABLE NAME

####################################################################

organizations

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

One organization owns

Users

Properties

Assets

Knowledge

Voice Sessions

Marketing Assets

Leads

Reports

Analytics

Billing

CRM Connections

Templates

Branding

Every major table references organization_id.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

NOT NULL

------------------------------------------------------------

name

TEXT

NOT NULL

Maximum Length

200

Example

Smith Realty Group

------------------------------------------------------------

slug

TEXT

NOT NULL

UNIQUE

Lowercase

Hyphenated

Example

smith-realty-group

------------------------------------------------------------

legal_name

TEXT

Nullable

Maximum Length

250

------------------------------------------------------------

organization_type

organization_type_enum

NOT NULL

Default

BROKERAGE

Allowed Values

BROKERAGE

AGENT

PROPERTY_MANAGER

ENTERPRISE

COMMERCIAL

OTHER

------------------------------------------------------------

website

TEXT

Nullable

HTTPS Required

------------------------------------------------------------

support_email

TEXT

Nullable

------------------------------------------------------------

support_phone

TEXT

Nullable

E164

------------------------------------------------------------

logo_url

TEXT

Nullable

Supabase Storage Path

------------------------------------------------------------

primary_color

TEXT

Nullable

HEX Color

------------------------------------------------------------

secondary_color

TEXT

Nullable

HEX Color

------------------------------------------------------------

default_language

TEXT

Default

en-US

------------------------------------------------------------

default_timezone

TEXT

Default

America/New_York

------------------------------------------------------------

default_voice

TEXT

Nullable

Voice Profile Identifier

------------------------------------------------------------

branding_theme

TEXT

Default

propertypilot-default

------------------------------------------------------------

status

organization_status_enum

Default

ACTIVE

Values

ACTIVE

TRIAL

SUSPENDED

ARCHIVED

PENDING

------------------------------------------------------------

subscription_plan

TEXT

Nullable

Cached reference

Primary billing source remains Stripe.

------------------------------------------------------------

max_users

INTEGER

Default

1

------------------------------------------------------------

max_properties

INTEGER

Default

25

------------------------------------------------------------

max_storage_gb

INTEGER

Default

5

------------------------------------------------------------

property_credits

INTEGER

Default

0

------------------------------------------------------------

ai_credits

INTEGER

Default

0

------------------------------------------------------------

billing_customer_id

TEXT

Nullable

Stripe Customer ID

------------------------------------------------------------

crm_provider

TEXT

Nullable

Example

GoHighLevel

------------------------------------------------------------

crm_connected

BOOLEAN

Default

FALSE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default

1

####################################################################

INDEXES

####################################################################

PRIMARY

id

UNIQUE

slug

INDEX

name

INDEX

status

INDEX

organization_type

INDEX

billing_customer_id

INDEX

created_at

INDEX

crm_provider

####################################################################

CHECK CONSTRAINTS

####################################################################

max_users >= 1

max_properties >= 0

max_storage_gb >= 1

property_credits >= 0

ai_credits >= 0

slug lowercase

slug unique

valid website format

####################################################################

FOREIGN KEYS

####################################################################

created_by

↓

[profiles.id](http://profiles.id)

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Policies

Platform Administrator

Full Access

Organization Owner

Full Access

Organization Administrator

Read / Write

Office Manager

Limited

Agent

Read Organization

Anonymous

No Access

No organization may query another organization.

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit Change

Publish Event

OrganizationUpdated

####################################################################

RELATED TABLES

####################################################################

organization_members

offices

teams

profiles

properties

knowledge_objects

marketing_assets

voice_sessions

buyer_sessions

subscriptions

crm_connections

analytics_events

audit_log

####################################################################

EVENTS

####################################################################

OrganizationCreated

OrganizationUpdated

OrganizationSuspended

OrganizationArchived

SubscriptionChanged

CRMConnected

CRMDisconnected

####################################################################

REPOSITORY

####################################################################

OrganizationRepository

Methods

create()

update()

findById()

findBySlug()

list()

archive()

restore()

exists()

search()

changeSubscription()

incrementCredits()

decrementCredits()

####################################################################

TYPESCRIPT

####################################################################

interface Organization {

id:string;

name:string;

slug:string;

legalName?:string;

organizationType:OrganizationType;

website?:string;

supportEmail?:string;

supportPhone?:string;

logoUrl?:string;

primaryColor?:string;

secondaryColor?:string;

defaultLanguage:string;

defaultTimezone:string;

defaultVoice?:string;

brandingTheme:string;

status:OrganizationStatus;

subscriptionPlan?:string;

maxUsers:number;

maxProperties:number;

maxStorageGb:number;

propertyCredits:number;

aiCredits:number;

billingCustomerId?:string;

crmProvider?:string;

crmConnected:boolean;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

An Organization owns every object beneath it.

Organizations cannot share data.

Deleting an Organization never immediately deletes data.

Organizations may be archived.

Archived Organizations cannot log in.

Every Property must reference exactly one Organization.

Every AI conversation belongs to an Organization.

Every uploaded file belongs to an Organization.

####################################################################

PERFORMANCE NOTES

####################################################################

Organization lookups occur on nearly every authenticated request.

This table should remain relatively small.

Frequently accessed organization metadata should be cached.

Authorization should never rely solely on cache.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Organization Created

Brand Updated

Subscription Changed

Credit Changes

CRM Connected

User Added

User Removed

Status Changed

Ownership Changed

All changes are immutable.

####################################################################

SUCCESS

####################################################################

The Organizations table establishes the security boundary for

PropertyPilot.

It is the foundation for multi-tenancy, enterprise scalability,

billing, permissions and complete customer data isolation.



####################################################################

TABLE

####################################################################

organization_members

####################################################################

PURPOSE

####################################################################

The organization_members table defines membership within an

Organization.

This table answers one question:

"What users belong to which Organization?"

A single user may belong to multiple Organizations.

Each membership is independent.

Permissions are assigned through the membership rather than the

user profile itself.

This enables

• Brokerages

• Consultants

• Contractors

• Assistants

• Multi-office agents

• Franchise organizations

without duplicating user accounts.

####################################################################

TABLE NAME

####################################################################

organization_members

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

A membership represents one relationship between

Profile

↓

Organization

Every authenticated request resolves membership before checking

permissions.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

profile_id

UUID

NOT NULL

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

office_id

UUID

Nullable

References

[offices.id](http://offices.id)

------------------------------------------------------------

team_id

UUID

Nullable

References

[teams.id](http://teams.id)

------------------------------------------------------------

role

organization_role_enum

NOT NULL

------------------------------------------------------------

status

membership_status_enum

Default

ACTIVE

Values

ACTIVE

INVITED

PENDING

SUSPENDED

ARCHIVED

------------------------------------------------------------

is_owner

BOOLEAN

Default FALSE

Only one owner permitted per Organization.

------------------------------------------------------------

is_primary

BOOLEAN

Default FALSE

Indicates the user's default organization when they belong to

multiple organizations.

------------------------------------------------------------

invited_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

invited_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

accepted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

last_active_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

profile_id

Unique

A user may only have one membership per organization.

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

profile_id

INDEX

office_id

INDEX

team_id

INDEX

role

INDEX

status

INDEX

last_active_at

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

profile_id

↓

[profiles.id](http://profiles.id)

office_id

↓

[offices.id](http://offices.id)

team_id

↓

[teams.id](http://teams.id)

invited_by

↓

[profiles.id](http://profiles.id)

created_by

↓

[profiles.id](http://profiles.id)

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Read / Write

Organization Administrator

Read / Write

Office Manager

Scoped Access

Team Leader

Scoped Access

Agent

Read Own Membership

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit membership changes

Publish MembershipUpdated event

####################################################################

RELATED TABLES

####################################################################

profiles

organizations

offices

teams

roles

permissions

audit_log

notifications

####################################################################

EVENTS

####################################################################

MemberInvited

MemberJoined

MemberSuspended

MemberArchived

MemberRoleChanged

PrimaryOrganizationChanged

####################################################################

REPOSITORY

####################################################################

OrganizationMemberRepository

Methods

create()

invite()

acceptInvitation()

updateRole()

assignOffice()

assignTeam()

suspend()

archive()

restore()

findByProfile()

findByOrganization()

findOwners()

exists()

####################################################################

TYPESCRIPT

####################################################################

interface OrganizationMember {

id:string;

organizationId:string;

profileId:string;

officeId?:string;

teamId?:string;

role:OrganizationRole;

status:MembershipStatus;

isOwner:boolean;

isPrimary:boolean;

invitedBy?:string;

invitedAt?:Date;

acceptedAt?:Date;

lastActiveAt?:Date;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every authenticated user must have at least one active membership.

Only one owner exists per organization.

Users may belong to multiple organizations.

Exactly one membership may be marked as primary.

Suspended members cannot authenticate into the organization.

Archived memberships remain for auditing.

Deleting a membership never deletes the profile.

####################################################################

PERFORMANCE NOTES

####################################################################

Membership lookup occurs immediately after authentication.

This table should be aggressively indexed.

Membership resolution should be cached for the duration of a request.

Authorization decisions must always verify current membership.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Invitation Sent

Invitation Accepted

Role Changed

Office Changed

Team Changed

Membership Suspended

Membership Restored

Ownership Transferred

Primary Organization Changed

Every change is immutable.

####################################################################

SUCCESS

####################################################################

The organization_members table becomes the authorization entry

point for the platform.

Every authenticated request resolves through this table before

accessing business data, providing secure multi-tenancy and

flexible enterprise organization management.



####################################################################

TABLE

####################################################################

roles

####################################################################

PURPOSE

####################################################################

The roles table defines reusable permission groups within an

Organization.

A Role represents a collection of permissions.

Users are assigned Roles through organization_members.

Permissions are never assigned directly to users except through

explicit overrides.

Examples

Organization Owner

Broker

Office Manager

Team Leader

Listing Agent

Buyer's Agent

Marketing

Transaction Coordinator

Administrative Assistant

Read Only

Custom Roles

Every Organization may create custom Roles.

####################################################################

TABLE NAME

####################################################################

roles

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Roles define

Capabilities

Restrictions

Administrative rights

Publishing rights

AI permissions

Billing permissions

CRM permissions

Reporting permissions

Roles are Organization scoped.

Two organizations may both have a role named

Marketing Manager

without sharing permissions.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

name

TEXT

NOT NULL

Maximum

100 Characters

Example

Listing Agent

------------------------------------------------------------

slug

TEXT

NOT NULL

Lowercase

Unique per Organization

Example

listing-agent

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

system_role

BOOLEAN

Default FALSE

TRUE

Built-in role

FALSE

Organization created role

------------------------------------------------------------

priority

INTEGER

Default

100

Lower numbers evaluated first.

------------------------------------------------------------

status

role_status_enum

Default

ACTIVE

------------------------------------------------------------

is_assignable

BOOLEAN

Default TRUE

Prevents assignment of internal roles.

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

slug

Unique

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

slug

INDEX

status

INDEX

priority

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

created_by

↓

[profiles.id](http://profiles.id)

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Create

Update

Delete

Assign

Organization Administrator

Read

Assign

Office Manager

Read

Agent

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit Role Changes

Publish RoleUpdated event

####################################################################

RELATED TABLES

####################################################################

permissions

role_permissions

organization_members

audit_log

####################################################################

EVENTS

####################################################################

RoleCreated

RoleUpdated

RoleArchived

RoleDeleted

RoleAssigned

RoleUnassigned

####################################################################

REPOSITORY

####################################################################

RoleRepository

Methods

create()

update()

archive()

restore()

delete()

find()

findBySlug()

list()

assign()

duplicate()

search()

####################################################################

TYPESCRIPT

####################################################################

interface Role {

id:string;

organizationId:string;

name:string;

slug:string;

description?:string;

systemRole:boolean;

priority:number;

status:RoleStatus;

isAssignable:boolean;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

SYSTEM ROLES

####################################################################

PropertyPilot automatically creates

Owner

Administrator

Office Manager

Team Leader

Listing Agent

Assistant

Marketing

Read Only

These may be copied.

System Roles cannot be deleted.

####################################################################

BUSINESS RULES

####################################################################

Roles contain permissions.

Users receive permissions through Roles.

Organizations may create unlimited Roles.

Role names may duplicate across Organizations.

Slugs must be unique within an Organization.

Deleting a Role never removes audit history.

####################################################################

PERFORMANCE NOTES

####################################################################

Roles change infrequently.

Permissions should be cached.

Authorization should still validate current Role assignments.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Role Created

Role Updated

Role Deleted

Role Assigned

Role Removed

Role Duplicated

Permission Changes

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The Roles table provides the foundation for enterprise-grade

authorization while remaining flexible enough for independent

agents and small brokerages.



####################################################################

TABLE

####################################################################

permissions

####################################################################

PURPOSE

####################################################################

The permissions table defines every capability available within

PropertyPilot.

Permissions are immutable identifiers representing business actions.

Permissions are assigned to Roles through the role_permissions table.

Application code must authorize against permissions rather than

specific roles.

This allows organizations to create custom roles without requiring

changes to application logic.

####################################################################

TABLE NAME

####################################################################

permissions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

A Permission grants authority to perform a single action on a

specific resource.

Permissions follow the convention

resource.action

Examples

[property.read](http://property.read)

property.create

property.update

property.delete

property.publish

knowledge.approve

voice.start

voice.manage

lead.export

analytics.view

billing.manage

organization.manage

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

resource

TEXT

NOT NULL

Example

property

------------------------------------------------------------

action

TEXT

NOT NULL

Example

create

------------------------------------------------------------

permission_key

TEXT

NOT NULL

UNIQUE

Generated

resource.action

Example

property.publish

------------------------------------------------------------

display_name

TEXT

NOT NULL

Example

Publish Property

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

category

TEXT

NOT NULL

Examples

Property

Knowledge

Voice

Analytics

Billing

Marketing

CRM

Administration

Organization

Buyer Intelligence

------------------------------------------------------------

system_permission

BOOLEAN

Default TRUE

Permissions are created by the platform.

Organizations cannot create arbitrary permissions.

------------------------------------------------------------

status

permission_status_enum

Default

ACTIVE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

permission_key

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

UNIQUE

permission_key

INDEX

resource

INDEX

category

INDEX

status

####################################################################

FOREIGN KEYS

####################################################################

None

Permissions are global.

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Create

Update

Archive

Organization Users

Read Only

Anonymous

No Access

Permissions are centrally managed.

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit Permission Changes

Publish PermissionUpdated event

####################################################################

RELATED TABLES

####################################################################

roles

role_permissions

audit_log

####################################################################

EVENTS

####################################################################

PermissionCreated

PermissionUpdated

PermissionArchived

PermissionDeprecated

####################################################################

REPOSITORY

####################################################################

PermissionRepository

Methods

find()

findByKey()

list()

listByCategory()

exists()

search()

####################################################################

TYPESCRIPT

####################################################################

interface Permission {

id:string;

resource:string;

action:string;

permissionKey:string;

displayName:string;

description?:string;

category:string;

systemPermission:boolean;

status:PermissionStatus;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

DEFAULT PERMISSIONS

####################################################################

Examples

[property.read](http://property.read)

property.create

property.update

property.delete

property.publish

property.archive

property.export

[knowledge.read](http://knowledge.read)

knowledge.create

knowledge.update

knowledge.approve

knowledge.reject

knowledge.delete

voice.start

voice.manage

[voice.review](http://voice.review)

voice.delete

marketing.generate

marketing.publish

marketing.export

analytics.view

analytics.export

[buyer.read](http://buyer.read)

buyer.export

[lead.read](http://lead.read)

lead.update

lead.export

crm.connect

crm.sync

crm.disconnect

billing.view

billing.manage

organization.manage

user.invite

user.remove

user.update

admin.access

admin.audit

admin.featureflags

This list expands over time.

Permission keys never change once released.

####################################################################

BUSINESS RULES

####################################################################

Permissions are global.

Roles reference permissions.

Users never receive permissions directly.

Permission keys are immutable.

Deprecated permissions remain for audit history.

Application code authorizes against permission keys only.

####################################################################

PERFORMANCE NOTES

####################################################################

Permission catalog is small.

Safe to cache.

Authorization decisions should cache resolved permission sets

for the lifetime of a request only.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Permission Created

Permission Deprecated

Permission Archived

Role Permission Assignment

Role Permission Removal

Every change immutable.

####################################################################

SUCCESS

####################################################################

The permissions table becomes the canonical authorization catalog

for PropertyPilot.

Every protected operation within the platform maps to a single,

well-defined permission, enabling consistent authorization across

the web application, APIs, background jobs and future mobile clients.



####################################################################

TABLE

####################################################################

role_permissions

####################################################################

PURPOSE

####################################################################

The role_permissions table maps Roles to Permissions.

It defines which permissions belong to each role.

This table forms the core of the Role-Based Access Control (RBAC)

system.

Permissions are never stored directly on users.

Users inherit permissions through

Profile

↓

Organization Membership

↓

Role

↓

Role Permissions

↓

Permission

This table must remain simple, efficient and highly indexed.

####################################################################

TABLE NAME

####################################################################

role_permissions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each record grants one permission to one role.

Example

Role

Listing Agent

↓

Permission

property.publish

A Role with 25 permissions produces 25 records.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

role_id

UUID

NOT NULL

References

[roles.id](http://roles.id)

------------------------------------------------------------

permission_id

UUID

NOT NULL

References

[permissions.id](http://permissions.id)

------------------------------------------------------------

granted

BOOLEAN

Default TRUE

Allows future explicit deny rules.

Current implementation assumes TRUE.

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

role_id

+

permission_id

UNIQUE

A permission cannot be assigned twice to the same role.

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

role_id

INDEX

permission_id

COMPOSITE INDEX

role_id

permission_id

####################################################################

FOREIGN KEYS

####################################################################

role_id

↓

[roles.id](http://roles.id)

ON DELETE CASCADE

------------------------------------------------------------

permission_id

↓

[permissions.id](http://permissions.id)

ON DELETE RESTRICT

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Read

Write

Organization Administrator

Read

Write

Office Manager

Read Only

Agent

No Access

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

After Insert

Publish

RolePermissionGranted

------------------------------------------------------------

After Delete

Publish

RolePermissionRemoved

------------------------------------------------------------

Audit all changes.

####################################################################

RELATED TABLES

####################################################################

roles

permissions

organization_members

audit_log

####################################################################

EVENTS

####################################################################

PermissionGranted

PermissionRevoked

RolePermissionUpdated

####################################################################

REPOSITORY

####################################################################

RolePermissionRepository

Methods

grant()

revoke()

replace()

findByRole()

findByPermission()

exists()

copyRolePermissions()

####################################################################

TYPESCRIPT

####################################################################

interface RolePermission {

id:string;

roleId:string;

permissionId:string;

granted:boolean;

createdAt:Date;

createdBy?:string;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every Role must contain at least one permission.

Removing the final permission from a system role is prohibited.

Permissions inherited through roles only.

No duplicate assignments.

Deleting a Role automatically removes all associated

role_permissions.

Deleting a Permission is prohibited if referenced.

####################################################################

PERFORMANCE NOTES

####################################################################

This table participates in nearly every authorization decision.

It should remain narrow.

It should remain heavily indexed.

Resolved permissions may be cached for the duration of a request.

Long-lived permission caches are prohibited.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Permission Granted

Permission Revoked

Bulk Permission Import

Role Permission Copy

System Role Modification

All permission changes are immutable.

####################################################################

AUTHORIZATION FLOW

####################################################################

Authentication

↓

Resolve Membership

↓

Resolve Role

↓

Load Role Permissions

↓

Load Permission Catalog

↓

AuthorizationService.can()

↓

Allow / Deny

####################################################################

SUCCESS

####################################################################

The role_permissions table provides the scalable bridge between

roles and permissions.

It enables flexible enterprise authorization while maintaining

a simple, performant and maintainable RBAC implementation.



####################################################################

TABLE

####################################################################

api_keys

####################################################################

PURPOSE

####################################################################

The api_keys table manages all machine-to-machine authentication

within PropertyPilot.

API Keys allow approved external systems to interact with the

PropertyPilot API without requiring an interactive user login.

Examples

CRM Integrations

Automation

Enterprise Systems

Internal Services

Future Mobile Applications

Partner Applications

Public Developer API

Every API key belongs to exactly one Organization.

####################################################################

TABLE NAME

####################################################################

api_keys

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

API Keys authenticate systems.

They never authenticate people.

Keys are securely hashed before storage.

Plaintext keys are displayed only once during creation.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

name

TEXT

NOT NULL

Maximum

150 Characters

Example

Production CRM Integration

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

key_prefix

TEXT

NOT NULL

Example

pp_live_

Displayed in UI.

------------------------------------------------------------

key_hash

TEXT

NOT NULL

Hashed secret.

Never reversible.

------------------------------------------------------------

environment

api_environment_enum

Default

PRODUCTION

Allowed

DEVELOPMENT

STAGING

PRODUCTION

------------------------------------------------------------

status

api_key_status_enum

Default

ACTIVE

Allowed

ACTIVE

DISABLED

EXPIRED

REVOKED

------------------------------------------------------------

expires_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

last_used_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

last_used_ip

INET

Nullable

------------------------------------------------------------

last_user_agent

TEXT

Nullable

------------------------------------------------------------

rate_limit_per_minute

INTEGER

Default

600

------------------------------------------------------------

allowed_ips

JSONB

Nullable

CIDR list

------------------------------------------------------------

allowed_origins

JSONB

Nullable

Future browser-based APIs

------------------------------------------------------------

notes

TEXT

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

NOT NULL

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

status

INDEX

environment

INDEX

last_used_at

UNIQUE

key_hash

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Read

Create

Rotate

Revoke

Delete

Organization Administrator

Read

Rotate

Office Manager

No Access

Agents

No Access

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit changes

After Authentication

Update

last_used_at

last_used_ip

last_user_agent

Publish

ApiKeyUsed

####################################################################

RELATED TABLES

####################################################################

organizations

audit_log

security_events

api_usage_logs

webhooks

####################################################################

EVENTS

####################################################################

ApiKeyCreated

ApiKeyRotated

ApiKeyDisabled

ApiKeyRevoked

ApiKeyExpired

ApiKeyUsed

####################################################################

REPOSITORY

####################################################################

ApiKeyRepository

Methods

create()

rotate()

disable()

revoke()

delete()

find()

findByHash()

recordUsage()

validate()

list()

####################################################################

TYPESCRIPT

####################################################################

interface ApiKey {

id:string;

organizationId:string;

name:string;

description?:string;

keyPrefix:string;

environment:ApiEnvironment;

status:ApiKeyStatus;

expiresAt?:Date;

lastUsedAt?:Date;

lastUsedIp?:string;

lastUserAgent?:string;

rateLimitPerMinute:number;

allowedIps?:string[];

allowedOrigins?:string[];

notes?:string;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Plaintext API keys are never stored.

API keys are displayed only once.

Rotation creates a new key.

Revocation is permanent.

Disabled keys may be re-enabled.

Expired keys cannot authenticate.

API keys inherit Organization permissions.

Every request using an API key is audited.

####################################################################

SECURITY REQUIREMENTS

####################################################################

Hash using Argon2id.

Constant-time comparisons.

Rate limiting required.

Optional IP allow lists.

Optional expiration.

Automatic abuse detection.

Key rotation supported.

Immediate revocation supported.

####################################################################

PERFORMANCE NOTES

####################################################################

API key validation occurs before authorization.

Key lookup should use indexed hashes.

Permission resolution should be cached per request.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Key Created

Key Viewed

Key Rotated

Key Disabled

Key Revoked

Authentication Success

Authentication Failure

Rate Limit Violations

IP Violations

Every event immutable.

####################################################################

SUCCESS

####################################################################

The api_keys table provides secure, scalable machine authentication

for integrations, automation, enterprise customers and future public

developer APIs without compromising platform security.



####################################################################

TABLE

####################################################################

properties

####################################################################

PURPOSE

####################################################################

The properties table represents the root object of every Digital

Property Twin.

Everything in PropertyPilot ultimately belongs to a Property.

A Property owns

Assets

Knowledge Objects

Photos

Voice Notes

Documents

Marketing Assets

Buyer Sessions

Analytics

Timeline

AI Conversations

Reports

The Property is the root aggregate.

Deleting a Property never immediately deletes child records.

####################################################################

TABLE NAME

####################################################################

properties

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Represents one physical property.

Supports

Residential

Commercial

Industrial

Agricultural

Multi-Family

Land

Future property types.

Every Property belongs to exactly one Organization.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

portfolio_id

UUID

Nullable

References

[portfolios.id](http://portfolios.id)

Allows grouping of properties.

------------------------------------------------------------

owner_profile_id

UUID

NOT NULL

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

listing_agent_id

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

property_number

TEXT

NOT NULL

Human-readable internal identifier.

Example

PP-0000125

Unique per Organization.

------------------------------------------------------------

mls_number

TEXT

Nullable

Indexed.

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

250 Characters

------------------------------------------------------------

slug

TEXT

NOT NULL

Unique per Organization.

------------------------------------------------------------

property_type

property_type_enum

NOT NULL

Examples

Single Family

Condominium

Townhouse

Farm

Commercial

Industrial

Land

Mixed Use

------------------------------------------------------------

status

property_status_enum

Default

DRAFT

Allowed

DRAFT

BUILDING

READY

PUBLISHED

ARCHIVED

SOLD

OFF_MARKET

------------------------------------------------------------

asking_price

NUMERIC(14,2)

Nullable

------------------------------------------------------------

currency

TEXT

Default

USD

------------------------------------------------------------

year_built

INTEGER

Nullable

------------------------------------------------------------

square_feet

INTEGER

Nullable

------------------------------------------------------------

lot_size

NUMERIC(12,2)

Nullable

------------------------------------------------------------

lot_unit

TEXT

Default

sqft

------------------------------------------------------------

bedrooms

DECIMAL(3,1)

Nullable

------------------------------------------------------------

bathrooms

DECIMAL(3,1)

Nullable

------------------------------------------------------------

garage_spaces

DECIMAL(3,1)

Nullable

------------------------------------------------------------

stories

DECIMAL(3,1)

Nullable

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

public_summary

TEXT

Nullable

AI Generated

Editable

------------------------------------------------------------

health_score

INTEGER

Default

0

Range

0–100

------------------------------------------------------------

knowledge_score

INTEGER

Default

0

------------------------------------------------------------

marketing_score

INTEGER

Default

0

------------------------------------------------------------

voice_score

INTEGER

Default

0

------------------------------------------------------------

buyer_score

INTEGER

Default

0

------------------------------------------------------------

published_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

archived_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default

1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

property_number

Unique

------------------------------------------------------------

organization_id

+

slug

Unique

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

portfolio_id

INDEX

listing_agent_id

INDEX

status

INDEX

property_type

INDEX

mls_number

INDEX

asking_price

INDEX

health_score

INDEX

published_at

FULL TEXT

title

description

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

portfolio_id

↓

[portfolios.id](http://portfolios.id)

owner_profile_id

↓

[profiles.id](http://profiles.id)

listing_agent_id

↓

[profiles.id](http://profiles.id)

created_by

↓

[profiles.id](http://profiles.id)

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Full Access

Organization Administrator

Read / Write

Listing Agent

Scoped Access

Assigned Team

Scoped Access

Read Only Users

Read

Anonymous

Published Property Only

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Recalculate Health Score

Publish PropertyUpdated

Audit Change

####################################################################

RELATED TABLES

####################################################################

property_addresses

assets

knowledge_objects

photos

documents

voice_notes

buyer_sessions

analytics_events

marketing_assets

property_timelines

property_versions

####################################################################

EVENTS

####################################################################

PropertyCreated

PropertyUpdated

PropertyPublished

PropertyArchived

PropertySold

PropertyHealthChanged

PropertyDeleted

####################################################################

REPOSITORY

####################################################################

PropertyRepository

Methods

create()

update()

publish()

archive()

restore()

duplicate()

search()

find()

calculateHealth()

list()

findByMLS()

####################################################################

TYPESCRIPT

####################################################################

interface Property {

id:string;

organizationId:string;

portfolioId?:string;

ownerProfileId:string;

listingAgentId?:string;

propertyNumber:string;

mlsNumber?:string;

title:string;

slug:string;

propertyType:PropertyType;

status:PropertyStatus;

askingPrice?:number;

currency:string;

yearBuilt?:number;

squareFeet?:number;

lotSize?:number;

lotUnit:string;

bedrooms?:number;

bathrooms?:number;

garageSpaces?:number;

stories?:number;

description?:string;

publicSummary?:string;

healthScore:number;

knowledgeScore:number;

marketingScore:number;

voiceScore:number;

buyerScore:number;

publishedAt?:Date;

archivedAt?:Date;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every Property belongs to one Organization.

Every Property owns one Digital Property Twin.

Every Asset belongs to one Property.

Publishing requires minimum health score.

Archiving never removes historical data.

Deleting a Property requires administrative approval.

Health Score recalculates automatically when knowledge changes.

####################################################################

PERFORMANCE NOTES

####################################################################

Property lookups are among the most frequent queries.

Indexes should support

Dashboard

Search

Analytics

Publishing

Reporting

Authorization

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Property Created

Property Published

Price Changed

Listing Agent Changed

Status Changed

Health Score Changed

Archived

Deleted

Ownership Changed

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The properties table serves as the root aggregate for the Digital

Property Twin.

Every feature in PropertyPilot ultimately extends, enriches or

analyzes a Property through its associated Assets, Knowledge,

Conversations and Intelligence.



####################################################################

TABLE

####################################################################

assets

####################################################################

PURPOSE

####################################################################

The assets table represents every physical or conceptual component

that makes up a Property.

Assets are the foundation of the Digital Property Twin.

Instead of storing information by "room", PropertyPilot stores

information by Assets.

Examples

Kitchen

Primary Bedroom

Roof

HVAC

Workshop

Swimming Pool

Solar Panels

Landscape

Neighborhood

School District

Garage

Electrical System

Foundation

Garden

Boat Dock

Commercial Loading Dock

Lobby

Conference Room

Anything that can be discussed,

photographed,

maintained,

documented,

or questioned

is an Asset.

####################################################################

TABLE NAME

####################################################################

assets

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Every Property contains zero or more Assets.

Assets may contain child Assets.

Example

House

↓

Kitchen

↓

Kitchen Island

↓

Wine Refrigerator

This recursive structure allows unlimited flexibility.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

property_id

UUID

NOT NULL

References

[properties.id](http://properties.id)

------------------------------------------------------------

parent_asset_id

UUID

Nullable

Self Reference

Allows hierarchy.

------------------------------------------------------------

asset_type

asset_type_enum

NOT NULL

Examples

ROOM

SYSTEM

STRUCTURE

EXTERIOR

LANDSCAPE

UTILITY

FEATURE

LOCATION

AMENITY

EQUIPMENT

CUSTOM

------------------------------------------------------------

name

TEXT

NOT NULL

Maximum

150 Characters

Examples

Kitchen

Roof

Workshop

Primary Bedroom

HVAC

------------------------------------------------------------

slug

TEXT

NOT NULL

Generated

Unique per Property

------------------------------------------------------------

display_order

INTEGER

Default

100

------------------------------------------------------------

summary

TEXT

Nullable

One paragraph.

------------------------------------------------------------

public_summary

TEXT

Nullable

AI Generated

Editable

------------------------------------------------------------

voice_intro

TEXT

Nullable

Default introduction spoken by AI.

------------------------------------------------------------

estimated_view_time

INTEGER

Nullable

Seconds

------------------------------------------------------------

map_x

NUMERIC

Nullable

Floor plan coordinate.

------------------------------------------------------------

map_y

NUMERIC

Nullable

Floor plan coordinate.

------------------------------------------------------------

qr_enabled

BOOLEAN

Default TRUE

------------------------------------------------------------

featured

BOOLEAN

Default FALSE

------------------------------------------------------------

visibility

asset_visibility_enum

Default

PUBLIC

------------------------------------------------------------

verification_status

verification_status_enum

Default

PENDING

------------------------------------------------------------

health_score

INTEGER

Default

0

Range

0-100

------------------------------------------------------------

knowledge_score

INTEGER

Default

0

------------------------------------------------------------

photo_count

INTEGER

Default

0

------------------------------------------------------------

document_count

INTEGER

Default

0

------------------------------------------------------------

voice_note_count

INTEGER

Default

0

------------------------------------------------------------

buyer_interest_score

INTEGER

Default

0

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

property_id

+

slug

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

property_id

INDEX

parent_asset_id

INDEX

asset_type

INDEX

featured

INDEX

verification_status

INDEX

health_score

INDEX

display_order

FULL TEXT

name

summary

####################################################################

FOREIGN KEYS

####################################################################

property_id

↓

[properties.id](http://properties.id)

ON DELETE CASCADE

------------------------------------------------------------

parent_asset_id

↓

[assets.id](http://assets.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Organization Members

Scoped

Listing Agent

Read / Write

Editors

Read / Write

Read Only

Read

Anonymous

Published Assets Only

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Recalculate Health Score

Publish AssetUpdated

Audit Change

####################################################################

RELATED TABLES

####################################################################

knowledge_objects

photos

voice_notes

documents

maintenance_records

buyer_questions

asset_relationships

asset_versions

analytics_events

####################################################################

EVENTS

####################################################################

AssetCreated

AssetUpdated

AssetDeleted

AssetPublished

AssetVerified

AssetHealthChanged

AssetViewed

####################################################################

REPOSITORY

####################################################################

AssetRepository

Methods

create()

update()

delete()

restore()

duplicate()

find()

findTree()

findChildren()

move()

publish()

calculateHealth()

search()

####################################################################

TYPESCRIPT

####################################################################

interface Asset {

id:string;

propertyId:string;

parentAssetId?:string;

assetType:AssetType;

name:string;

slug:string;

displayOrder:number;

summary?:string;

publicSummary?:string;

voiceIntro?:string;

estimatedViewTime?:number;

mapX?:number;

mapY?:number;

qrEnabled:boolean;

featured:boolean;

visibility:AssetVisibility;

verificationStatus:VerificationStatus;

healthScore:number;

knowledgeScore:number;

photoCount:number;

documentCount:number;

voiceNoteCount:number;

buyerInterestScore:number;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every Asset belongs to one Property.

Assets may have unlimited child Assets.

Assets own

Knowledge

Photos

Voice Notes

Documents

Maintenance

Questions

Timeline

Analytics

Assets may be hidden.

Featured Assets appear first.

Health recalculates automatically.

Deleting an Asset archives its children.

####################################################################

PERFORMANCE NOTES

####################################################################

Assets are loaded for nearly every buyer experience.

Tree traversal must be optimized.

Recursive queries should use indexed parent relationships.

Asset summaries should be cached for published properties.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Asset Created

Asset Updated

Asset Moved

Asset Renamed

Visibility Changed

Featured Changed

Verification Changed

Hierarchy Changed

Health Changed

Deletion

Every event immutable.

####################################################################

SUCCESS

####################################################################

The assets table transforms a Property into a structured,

navigable Digital Property Twin.

Every buyer interaction, AI conversation, document, photograph,

voice note and knowledge object ultimately attaches to an Asset,

making it the central organizing structure of the platform.



####################################################################

TABLE

####################################################################

knowledge_objects

####################################################################

PURPOSE

####################################################################

The knowledge_objects table stores every verified piece of

knowledge known about an Asset.

It represents structured intelligence.

Knowledge Objects are not documents.

They are not conversations.

They are not AI responses.

They are the permanent knowledge base from which AI reasons.

Everything the AI says about a property should ultimately trace

back to one or more Knowledge Objects.

####################################################################

TABLE NAME

####################################################################

knowledge_objects

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Knowledge Objects describe facts about Assets.

Examples

Roof

Age

Material

Warranty

Repairs

HVAC

Manufacturer

Installation Date

Maintenance History

Electrical Panel

Service Size

Breaker Count

Kitchen

Countertop Material

Cabinet Brand

Appliances

Workshop

220V Circuits

Insulation

Skylight

French Doors

Every Knowledge Object belongs to exactly one Asset.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

asset_id

UUID

NOT NULL

References

[assets.id](http://assets.id)

------------------------------------------------------------

category

knowledge_category_enum

NOT NULL

Examples

Construction

Mechanical

Electrical

Plumbing

Interior

Exterior

Maintenance

History

Warranty

Dimensions

Utilities

Accessibility

Neighborhood

Safety

Custom

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

200 Characters

Example

Workshop Electrical System

------------------------------------------------------------

slug

TEXT

NOT NULL

Unique per Asset

------------------------------------------------------------

summary

TEXT

NOT NULL

Human-readable overview.

------------------------------------------------------------

ai_summary

TEXT

Nullable

Generated by AI.

Editable.

------------------------------------------------------------

verification_status

verification_status_enum

Default

PENDING

------------------------------------------------------------

confidence_score

NUMERIC(5,2)

Default

0.00

Range

0–100

------------------------------------------------------------

importance_score

INTEGER

Default

50

Range

0–100

------------------------------------------------------------

public_visible

BOOLEAN

Default TRUE

------------------------------------------------------------

featured

BOOLEAN

Default FALSE

------------------------------------------------------------

search_keywords

TEXT[]

Nullable

------------------------------------------------------------

last_verified_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

expires_at

TIMESTAMPTZ

Nullable

Optional review reminder.

------------------------------------------------------------

source_count

INTEGER

Default 0

------------------------------------------------------------

evidence_count

INTEGER

Default 0

------------------------------------------------------------

question_count

INTEGER

Default 0

------------------------------------------------------------

view_count

INTEGER

Default 0

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

asset_id

+

slug

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

asset_id

INDEX

category

INDEX

verification_status

INDEX

importance_score

INDEX

featured

GIN INDEX

search_keywords

FULL TEXT

title

summary

ai_summary

####################################################################

FOREIGN KEYS

####################################################################

asset_id

↓

[assets.id](http://assets.id)

ON DELETE CASCADE

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped Access

Editors

Create

Update

Approve

Read Only

Read

Anonymous

Published Knowledge Only

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Refresh search vectors

Publish KnowledgeUpdated

Audit Change

####################################################################

RELATED TABLES

####################################################################

knowledge_facts

knowledge_sources

knowledge_relationships

knowledge_versions

knowledge_reviews

documents

photos

voice_notes

buyer_questions

####################################################################

EVENTS

####################################################################

KnowledgeCreated

KnowledgeUpdated

KnowledgeVerified

KnowledgeRejected

KnowledgeViewed

KnowledgeArchived

####################################################################

REPOSITORY

####################################################################

KnowledgeRepository

Methods

create()

update()

approve()

reject()

archive()

restore()

find()

search()

findByAsset()

recalculateConfidence()

generateSummary()

####################################################################

TYPESCRIPT

####################################################################

interface KnowledgeObject {

id:string;

assetId:string;

category:KnowledgeCategory;

title:string;

slug:string;

summary:string;

aiSummary?:string;

verificationStatus:VerificationStatus;

confidenceScore:number;

importanceScore:number;

publicVisible:boolean;

featured:boolean;

searchKeywords?:string[];

lastVerifiedAt?:Date;

expiresAt?:Date;

sourceCount:number;

evidenceCount:number;

questionCount:number;

viewCount:number;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every Knowledge Object belongs to exactly one Asset.

Knowledge Objects may contain many Facts.

Knowledge Objects may reference many Sources.

Knowledge Objects may relate to other Knowledge Objects.

Verification increases confidence.

Evidence increases confidence.

Contradictory evidence decreases confidence.

Expired knowledge is flagged for review.

Knowledge is never permanently deleted.

####################################################################

PERFORMANCE NOTES

####################################################################

Knowledge retrieval is on the critical path for every AI

conversation.

Search indexes must be optimized.

Featured knowledge should be cached.

AI retrieval should prioritize

Verified

High Confidence

High Importance

Most Recently Verified

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Knowledge Created

Knowledge Edited

Verification Approved

Verification Rejected

Visibility Changed

Importance Changed

Summary Regenerated

Confidence Changed

Evidence Added

Evidence Removed

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The knowledge_objects table becomes the permanent intelligence

layer of the Digital Property Twin.

It enables PropertyPilot to answer questions based on verified,

traceable knowledge rather than relying on general AI reasoning,

creating a durable competitive advantage as each property's

knowledge base grows over time.



####################################################################

TABLE

####################################################################

knowledge_facts

####################################################################

PURPOSE

####################################################################

The knowledge_facts table stores atomic facts.

Every fact represents one statement that can be verified,

referenced, updated, questioned and cited independently.

AI should reason from Facts.

Not paragraphs.

Not documents.

Not conversations.

Examples

Workshop Width = 23 ft

Workshop Length = 17 ft

Ceiling Height = 12 ft

Skylight Size = 3 x 8 ft

French Doors = Present

Floor Material = Ceramic Tile

Water Heater Brand = Fogatti

Water Heater Type = Tankless

Electrical = 120V

Electrical = 220V

Insulated = Yes

Heating Type = Forced Air

####################################################################

TABLE NAME

####################################################################

knowledge_facts

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Knowledge Facts are the smallest unit of truth inside the

Digital Property Twin.

Facts are individually searchable.

Individually verified.

Individually versioned.

Individually referenced.

Multiple facts belong to one Knowledge Object.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

knowledge_object_id

UUID

NOT NULL

References

knowledge_[objects.id](http://objects.id)

------------------------------------------------------------

fact_key

TEXT

NOT NULL

Example

ceiling_height

------------------------------------------------------------

fact_label

TEXT

NOT NULL

Example

Ceiling Height

------------------------------------------------------------

fact_type

knowledge_fact_type_enum

Examples

TEXT

NUMBER

BOOLEAN

DATE

MEASUREMENT

CURRENCY

ENUM

LIST

URL

REFERENCE

------------------------------------------------------------

fact_value

TEXT

NOT NULL

Canonical stored value.

------------------------------------------------------------

display_value

TEXT

Nullable

Formatted value shown to users.

Example

12 feet

------------------------------------------------------------

unit

TEXT

Nullable

Examples

ft

sqft

amps

volts

years

months

------------------------------------------------------------

sort_order

INTEGER

Default

100

------------------------------------------------------------

confidence

NUMERIC(5,2)

Default

100

------------------------------------------------------------

verification_status

verification_status_enum

Default

PENDING

------------------------------------------------------------

public_visible

BOOLEAN

Default TRUE

------------------------------------------------------------

featured

BOOLEAN

Default FALSE

------------------------------------------------------------

searchable

BOOLEAN

Default TRUE

------------------------------------------------------------

source_count

INTEGER

Default 0

------------------------------------------------------------

evidence_count

INTEGER

Default 0

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

knowledge_object_id

+

fact_key

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

knowledge_object_id

INDEX

fact_key

INDEX

verification_status

INDEX

featured

GIN INDEX

fact_value

FULL TEXT

fact_label

display_value

####################################################################

FOREIGN KEYS

####################################################################

knowledge_object_id

↓

knowledge_[objects.id](http://objects.id)

ON DELETE CASCADE

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped Access

Editors

Create

Update

Approve

Read Only

Read

Anonymous

Public Facts Only

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Refresh search vectors

Publish FactUpdated

Audit Change

####################################################################

RELATED TABLES

####################################################################

knowledge_objects

knowledge_sources

knowledge_evidence

knowledge_relationships

knowledge_fact_versions

buyer_questions

####################################################################

EVENTS

####################################################################

FactCreated

FactUpdated

FactVerified

FactRejected

FactViewed

FactDeleted

####################################################################

REPOSITORY

####################################################################

KnowledgeFactRepository

Methods

create()

update()

verify()

reject()

archive()

restore()

find()

findByKey()

findByKnowledgeObject()

search()

####################################################################

TYPESCRIPT

####################################################################

interface KnowledgeFact {

id:string;

knowledgeObjectId:string;

factKey:string;

factLabel:string;

factType:KnowledgeFactType;

factValue:string;

displayValue?:string;

unit?:string;

sortOrder:number;

confidence:number;

verificationStatus:VerificationStatus;

publicVisible:boolean;

featured:boolean;

searchable:boolean;

sourceCount:number;

evidenceCount:number;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Facts are immutable truth statements.

Each Fact represents one concept only.

Facts should never contain paragraphs.

Facts should never duplicate one another.

Measurements should store canonical values.

Display values may be localized.

Facts may accumulate evidence over time.

Facts are never permanently deleted.

####################################################################

EXAMPLE

####################################################################

Knowledge Object

Workshop

↓

Fact

Width

23

ft

↓

Fact

Length

17

ft

↓

Fact

Ceiling Height

12

ft

↓

Fact

Electrical

220V

↓

Fact

Water Heater

Fogatti Tankless

↓

Fact

Floor

Ceramic Tile

####################################################################

PERFORMANCE NOTES

####################################################################

Facts are retrieved constantly during AI conversations.

Indexes should prioritize

fact_key

verification_status

knowledge_object_id

Search should prefer verified facts.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Fact Created

Fact Modified

Verification Changed

Visibility Changed

Evidence Attached

Source Attached

Fact Deprecated

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The knowledge_facts table becomes the atomic truth layer of the

Digital Property Twin.

Every AI answer, brochure, analytics report and buyer response can

ultimately trace back to one or more verified facts, making

PropertyPilot explainable, trustworthy and continuously improvable.



####################################################################

TABLE

####################################################################

knowledge_sources

####################################################################

PURPOSE

####################################################################

The knowledge_sources table records where every piece of

property knowledge originated.

Every verified fact should reference one or more sources.

Sources establish provenance.

They increase confidence.

They enable auditing.

They explain AI responses.

PropertyPilot never asks users to simply "trust the AI."

Instead, the platform knows exactly where information came from.

####################################################################

TABLE NAME

####################################################################

knowledge_sources

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Sources may originate from

Voice Notes

Photographs

Documents

Manual Entry

MLS Imports

Builder Documents

Inspection Reports

Receipts

Invoices

Permits

Videos

Maintenance Records

AI Extraction

External Integrations

Every source can support multiple facts.

Every fact can reference multiple sources.

Many-to-many relationships are handled through

knowledge_fact_sources.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

asset_id

UUID

NOT NULL

References

[assets.id](http://assets.id)

------------------------------------------------------------

source_type

knowledge_source_type_enum

NOT NULL

Allowed Values

VOICE_NOTE

PHOTO

DOCUMENT

MANUAL

MLS

VIDEO

INSPECTION

INVOICE

PERMIT

MAINTENANCE

EXTERNAL_API

AI_EXTRACTION

OTHER

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

200 Characters

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

storage_path

TEXT

Nullable

Supabase Storage path

------------------------------------------------------------

external_url

TEXT

Nullable

------------------------------------------------------------

checksum

TEXT

Nullable

SHA-256 hash

Used to detect duplicates.

------------------------------------------------------------

mime_type

TEXT

Nullable

------------------------------------------------------------

file_size

BIGINT

Nullable

Bytes

------------------------------------------------------------

captured_at

TIMESTAMPTZ

Nullable

When source was created.

------------------------------------------------------------

uploaded_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

verified

BOOLEAN

Default FALSE

------------------------------------------------------------

verification_notes

TEXT

Nullable

------------------------------------------------------------

confidence_score

NUMERIC(5,2)

Default

100.00

------------------------------------------------------------

ai_processed

BOOLEAN

Default FALSE

------------------------------------------------------------

processing_status

processing_status_enum

Default

PENDING

------------------------------------------------------------

metadata

JSONB

Nullable

Camera information

OCR

Speech recognition

GPS

EXIF

Future provider metadata.

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

asset_id

INDEX

source_type

INDEX

verified

INDEX

processing_status

INDEX

captured_at

INDEX

uploaded_at

UNIQUE

checksum

####################################################################

FOREIGN KEYS

####################################################################

asset_id

↓

[assets.id](http://assets.id)

ON DELETE CASCADE

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped

Editors

Read / Write

Read Only

Read

Anonymous

No Access

Original evidence is never exposed publicly unless explicitly

published.

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Audit Change

Publish SourceUpdated

####################################################################

RELATED TABLES

####################################################################

knowledge_fact_sources

knowledge_objects

knowledge_facts

photos

documents

voice_notes

maintenance_records

####################################################################

EVENTS

####################################################################

SourceCreated

SourceVerified

SourceProcessed

SourceArchived

SourceDeleted

####################################################################

REPOSITORY

####################################################################

KnowledgeSourceRepository

Methods

create()

update()

verify()

archive()

restore()

find()

findByAsset()

findDuplicates()

markProcessed()

linkFact()

unlinkFact()

####################################################################

TYPESCRIPT

####################################################################

interface KnowledgeSource {

id:string;

assetId:string;

sourceType:KnowledgeSourceType;

title:string;

description?:string;

storagePath?:string;

externalUrl?:string;

checksum?:string;

mimeType?:string;

fileSize?:number;

capturedAt?:Date;

uploadedAt?:Date;

verified:boolean;

verificationNotes?:string;

confidenceScore:number;

aiProcessed:boolean;

processingStatus:ProcessingStatus;

metadata?:Record<string, unknown>;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Every source belongs to one Asset.

Multiple Facts may reference the same Source.

Duplicate uploads should be detected using checksum.

AI extraction never replaces the original source.

Original evidence is preserved.

Archived sources remain available for audit history.

####################################################################

PERFORMANCE NOTES

####################################################################

Source retrieval occurs frequently during

Knowledge verification

AI explanation

Timeline reconstruction

Indexes should optimize verification workflows.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Source Uploaded

Source Verified

Source Archived

Duplicate Detected

Processing Completed

Source Linked

Source Unlinked

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The knowledge_sources table provides complete provenance for the

Digital Property Twin.

Every important fact can be traced back to verifiable evidence,

allowing AI responses to be grounded in documented reality rather

than inference.



####################################################################

TABLE

####################################################################

knowledge_versions

####################################################################

PURPOSE

####################################################################

The knowledge_versions table stores the complete historical record

of every Knowledge Object.

Knowledge is never overwritten.

Every meaningful modification creates a new immutable version.

This allows PropertyPilot to answer questions such as

"When did this change?"

"What did we know six months ago?"

"Who changed this?"

"What was the previous value?"

"What evidence caused the change?"

Knowledge history is permanent.

####################################################################

TABLE NAME

####################################################################

knowledge_versions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each Knowledge Object may have many versions.

Example

Knowledge Object

Roof

↓

Version 1

Original Construction

↓

Version 2

Repair Added

↓

Version 3

Replacement Recorded

↓

Version 4

Warranty Updated

Only the newest approved version is considered current.

Older versions remain searchable.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

knowledge_object_id

UUID

NOT NULL

References

knowledge_[objects.id](http://objects.id)

------------------------------------------------------------

version_number

INTEGER

NOT NULL

Starts at

1

------------------------------------------------------------

change_type

knowledge_change_type_enum

Allowed

CREATED

UPDATED

VERIFIED

CORRECTED

ARCHIVED

MERGED

RESTORED

------------------------------------------------------------

title_snapshot

TEXT

NOT NULL

------------------------------------------------------------

summary_snapshot

TEXT

NOT NULL

------------------------------------------------------------

ai_summary_snapshot

TEXT

Nullable

------------------------------------------------------------

verification_status_snapshot

verification_status_enum

------------------------------------------------------------

confidence_snapshot

NUMERIC(5,2)

------------------------------------------------------------

importance_snapshot

INTEGER

------------------------------------------------------------

reason_for_change

TEXT

Nullable

Human explanation.

------------------------------------------------------------

change_source

knowledge_change_source_enum

Allowed

USER

AI

IMPORT

SYSTEM

WEBHOOK

VOICE

OCR

DOCUMENT

------------------------------------------------------------

approved

BOOLEAN

Default TRUE

------------------------------------------------------------

approved_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

approved_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

previous_version_id

UUID

Nullable

Self Reference

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

####################################################################

UNIQUE CONSTRAINTS

####################################################################

knowledge_object_id

+

version_number

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

knowledge_object_id

INDEX

version_number

INDEX

change_type

INDEX

approved

INDEX

created_at

####################################################################

FOREIGN KEYS

####################################################################

knowledge_object_id

↓

knowledge_[objects.id](http://objects.id)

------------------------------------------------------------

approved_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

previous_version_id

↓

knowledge_[versions.id](http://versions.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Read

Editors

Read

Create

Approvers

Approve

Read Only

Read

Anonymous

No Access

Version history is never publicly exposed.

####################################################################

TRIGGERS

####################################################################

After Knowledge Update

Create Version

Audit Change

Publish KnowledgeVersionCreated

####################################################################

RELATED TABLES

####################################################################

knowledge_objects

knowledge_facts

knowledge_sources

audit_log

####################################################################

EVENTS

####################################################################

KnowledgeVersionCreated

KnowledgeVersionApproved

KnowledgeVersionRejected

KnowledgeVersionRestored

####################################################################

REPOSITORY

####################################################################

KnowledgeVersionRepository

Methods

create()

find()

findLatest()

findHistory()

restore()

approve()

reject()

compare()

####################################################################

TYPESCRIPT

####################################################################

interface KnowledgeVersion {

id:string;

knowledgeObjectId:string;

versionNumber:number;

changeType:KnowledgeChangeType;

titleSnapshot:string;

summarySnapshot:string;

aiSummarySnapshot?:string;

verificationStatusSnapshot:VerificationStatus;

confidenceSnapshot:number;

importanceSnapshot:number;

reasonForChange?:string;

changeSource:KnowledgeChangeSource;

approved:boolean;

approvedBy?:string;

approvedAt?:Date;

previousVersionId?:string;

createdAt:Date;

createdBy:string;

}

####################################################################

BUSINESS RULES

####################################################################

Knowledge history is immutable.

Versions cannot be edited.

Restoring creates a new version.

Deleting a Knowledge Object never removes history.

Every significant modification creates a new version.

Minor metadata changes may be excluded.

####################################################################

PERFORMANCE NOTES

####################################################################

Most queries access only the latest version.

Historical versions are retrieved on demand.

History should not impact normal AI response latency.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Version Created

Version Approved

Version Restored

Version Compared

Version Archived

Reason for Change

Approver

Timestamp

Every version permanent.

####################################################################

SUCCESS

####################################################################

The knowledge_versions table provides complete historical

traceability for the Digital Property Twin.

Every evolution of property knowledge is preserved, allowing

PropertyPilot to explain not only what is known today, but how

that knowledge has changed over the lifetime of the property.



####################################################################

TABLE

####################################################################

buyer_questions

####################################################################

PURPOSE

####################################################################

The buyer_questions table stores every question asked by buyers,

agents and visitors during AI conversations.

Questions become part of the Digital Property Twin.

Frequently asked questions improve

Knowledge

Marketing

Property descriptions

AI responses

Lead qualification

Agent preparation

Every question has long-term value.

####################################################################

TABLE NAME

####################################################################

buyer_questions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Questions are linked to

Property

Asset

Knowledge Object (optional)

Conversation

Visitor Session

Lead

Questions may later become

Knowledge Objects

FAQs

Marketing copy

Showing reports

Training material

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

property_id

UUID

NOT NULL

References

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

UUID

Nullable

References

[assets.id](http://assets.id)

------------------------------------------------------------

knowledge_object_id

UUID

Nullable

References

knowledge_[objects.id](http://objects.id)

------------------------------------------------------------

visitor_session_id

UUID

Nullable

References

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

conversation_id

UUID

Nullable

References

voice_[sessions.id](http://sessions.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

question

TEXT

NOT NULL

Original wording.

------------------------------------------------------------

normalized_question

TEXT

NOT NULL

Canonical version.

Example

How old is the furnace?

------------------------------------------------------------

embedding

VECTOR

Nullable

Semantic similarity search.

------------------------------------------------------------

intent

TEXT

Nullable

Example

Age

Maintenance

Dimensions

Utility

Warranty

------------------------------------------------------------

answered

BOOLEAN

Default TRUE

------------------------------------------------------------

answer_source

question_answer_source_enum

Allowed

Knowledge

AI

Agent

Unknown

------------------------------------------------------------

confidence

NUMERIC(5,2)

Default

100

------------------------------------------------------------

answer_time_ms

INTEGER

Nullable

------------------------------------------------------------

was_follow_up

BOOLEAN

Default FALSE

------------------------------------------------------------

was_unanswered

BOOLEAN

Default FALSE

------------------------------------------------------------

requires_agent_followup

BOOLEAN

Default FALSE

------------------------------------------------------------

language

TEXT

Default

en-US

------------------------------------------------------------

sentiment

buyer_sentiment_enum

Nullable

------------------------------------------------------------

importance_score

INTEGER

Default

50

------------------------------------------------------------

question_count

INTEGER

Default

1

Merged duplicate count.

------------------------------------------------------------

last_asked_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

property_id

INDEX

asset_id

INDEX

knowledge_object_id

INDEX

visitor_session_id

INDEX

intent

INDEX

importance_score

INDEX

requires_agent_followup

INDEX

last_asked_at

VECTOR INDEX

embedding

FULL TEXT

question

normalized_question

####################################################################

FOREIGN KEYS

####################################################################

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

↓

[assets.id](http://assets.id)

------------------------------------------------------------

knowledge_object_id

↓

knowledge_[objects.id](http://objects.id)

------------------------------------------------------------

visitor_session_id

↓

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

conversation_id

↓

voice_[sessions.id](http://sessions.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped

Listing Agent

Read

Editors

Read

Write

Anonymous

No Access

Buyer identity protected.

####################################################################

TRIGGERS

####################################################################

Before Update

Update updated_at

Increment version

Generate embeddings if changed

Publish BuyerQuestionCreated

Audit Change

####################################################################

RELATED TABLES

####################################################################

visitor_sessions

voice_sessions

knowledge_objects

knowledge_facts

analytics_events

recommendations

####################################################################

EVENTS

####################################################################

QuestionAsked

QuestionMerged

QuestionAnswered

QuestionFlagged

AgentFollowUpRequested

####################################################################

REPOSITORY

####################################################################

BuyerQuestionRepository

Methods

create()

mergeDuplicates()

find()

findByAsset()

findByProperty()

search()

findTrending()

flag()

linkKnowledge()

####################################################################

TYPESCRIPT

####################################################################

interface BuyerQuestion {

id:string;

propertyId:string;

assetId?:string;

knowledgeObjectId?:string;

visitorSessionId?:string;

conversationId?:string;

leadId?:string;

question:string;

normalizedQuestion:string;

intent?:string;

answered:boolean;

answerSource:QuestionAnswerSource;

confidence:number;

answerTimeMs?:number;

wasFollowUp:boolean;

wasUnanswered:boolean;

requiresAgentFollowup:boolean;

language:string;

sentiment?:BuyerSentiment;

importanceScore:number;

questionCount:number;

lastAskedAt:Date;

createdAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Duplicate questions should merge.

Question wording preserved.

Normalized question used for analytics.

Frequently asked questions increase importance.

Unanswered questions become recommendations.

Agent follow-up creates CRM task.

Questions may evolve into Knowledge Objects.

####################################################################

PERFORMANCE NOTES

####################################################################

Semantic search required.

Embedding generation asynchronous.

Trending calculations performed in background jobs.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Question Asked

Question Merged

Knowledge Linked

Agent Follow-up

Confidence Changed

Embedding Generated

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The buyer_questions table transforms conversations into

organizational intelligence.

Every question asked improves the Digital Property Twin,

reveals buyer priorities, and helps agents continuously improve

their listings, marketing and property knowledge.



####################################################################

TABLE

####################################################################

visitor_sessions

####################################################################

PURPOSE

####################################################################

The visitor_sessions table represents a complete buyer interaction

with a property.

A Visitor Session begins when a buyer enters the PropertyPilot

experience.

It ends when they leave.

Everything during the visit belongs to the Session.

Questions

Voice

Assets Viewed

Time Spent

Lead Capture

Analytics

Recommendations

Conversation

Interest

The Session is the foundation of Buyer Intelligence.

####################################################################

TABLE NAME

####################################################################

visitor_sessions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

A Visitor Session represents one visit.

The visitor may

Remain anonymous

Identify themselves

Become a lead

Request a showing

Download documents

Continue later

Resume on another device

Every interaction belongs to the Session.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

property_id

UUID

NOT NULL

References

[properties.id](http://properties.id)

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

public_token

TEXT

NOT NULL

Unique

QR token.

------------------------------------------------------------

anonymous_id

TEXT

Nullable

Browser identifier.

------------------------------------------------------------

device_type

visitor_device_enum

Desktop

Tablet

Mobile

Kiosk

------------------------------------------------------------

browser

TEXT

Nullable

------------------------------------------------------------

operating_system

TEXT

Nullable

------------------------------------------------------------

language

TEXT

Default

en-US

------------------------------------------------------------

country

TEXT

Nullable

------------------------------------------------------------

region

TEXT

Nullable

------------------------------------------------------------

city

TEXT

Nullable

Approximate only.

------------------------------------------------------------

timezone

TEXT

Nullable

------------------------------------------------------------

started_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

ended_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

duration_seconds

INTEGER

Default

0

------------------------------------------------------------

last_activity_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

entry_source

visitor_entry_source_enum

Examples

QR

EMAIL

TEXT

MLS

WEBSITE

SOCIAL

AGENT

OPEN_HOUSE

------------------------------------------------------------

session_status

visitor_session_status_enum

ACTIVE

COMPLETED

ABANDONED

EXPIRED

------------------------------------------------------------

lead_captured

BOOLEAN

Default FALSE

------------------------------------------------------------

brochure_downloaded

BOOLEAN

Default FALSE

------------------------------------------------------------

showing_requested

BOOLEAN

Default FALSE

------------------------------------------------------------

assets_viewed

INTEGER

Default 0

------------------------------------------------------------

questions_asked

INTEGER

Default 0

------------------------------------------------------------

voice_minutes

INTEGER

Default 0

------------------------------------------------------------

engagement_score

INTEGER

Default 0

Range

0–100

------------------------------------------------------------

buyer_intent_score

INTEGER

Default 0

Range

0–100

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

public_token

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

property_id

INDEX

organization_id

INDEX

lead_id

INDEX

started_at

INDEX

last_activity_at

INDEX

session_status

INDEX

buyer_intent_score

INDEX

engagement_score

INDEX

entry_source

####################################################################

FOREIGN KEYS

####################################################################

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped

Listing Agent

Read

Analytics Users

Read

Anonymous

Own Session Only

No cross-session visibility.

####################################################################

TRIGGERS

####################################################################

Session Start

Create analytics record

------------------------------------------------------------

Session End

Calculate

Duration

Intent

Engagement

Publish VisitorSessionCompleted

Audit session

####################################################################

RELATED TABLES

####################################################################

buyer_questions

voice_sessions

analytics_events

assets

leads

marketing_assets

property_views

####################################################################

EVENTS

####################################################################

VisitorSessionStarted

VisitorSessionCompleted

VisitorIdentified

LeadCaptured

BrochureDownloaded

ShowingRequested

####################################################################

REPOSITORY

####################################################################

VisitorSessionRepository

Methods

start()

resume()

complete()

find()

findActive()

identify()

calculateIntent()

calculateEngagement()

archive()

####################################################################

TYPESCRIPT

####################################################################

interface VisitorSession {

id:string;

propertyId:string;

organizationId:string;

leadId?:string;

publicToken:string;

anonymousId?:string;

deviceType:VisitorDevice;

browser?:string;

operatingSystem?:string;

language:string;

country?:string;

region?:string;

city?:string;

timezone?:string;

startedAt:Date;

endedAt?:Date;

durationSeconds:number;

lastActivityAt?:Date;

entrySource:VisitorEntrySource;

sessionStatus:VisitorSessionStatus;

leadCaptured:boolean;

brochureDownloaded:boolean;

showingRequested:boolean;

assetsViewed:number;

questionsAsked:number;

voiceMinutes:number;

engagementScore:number;

buyerIntentScore:number;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

One session per visit.

Visitors may resume sessions.

Anonymous sessions may later become leads.

Lead capture never breaks conversation continuity.

Engagement recalculates continuously.

Intent recalculates after meaningful interactions.

Session expiration configurable.

####################################################################

PERFORMANCE NOTES

####################################################################

Sessions drive dashboards.

Indexes optimized for

Recent sessions

Active sessions

Analytics

Lead conversion

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Session Started

Session Resumed

Lead Captured

Session Completed

Intent Changed

Engagement Changed

Every transition immutable.

####################################################################

SUCCESS

####################################################################

The visitor_sessions table represents the complete digital journey

of a buyer through a property.

Rather than recording isolated page views, PropertyPilot captures

a coherent exploration session that links AI conversations,

questions, assets viewed and buyer behavior into a single,

valuable record.



####################################################################

TABLE

####################################################################

leads

####################################################################

PURPOSE

####################################################################

The leads table represents identified visitors who have provided

contact information or otherwise become known prospects.

A Lead is created when an anonymous Visitor Session transitions

into an identifiable person.

A Lead aggregates

Sessions

Questions

Engagement

Buyer Intent

Marketing Activity

CRM Synchronization

Communication

Future Showings

One Lead may participate in many Visitor Sessions.

####################################################################

TABLE NAME

####################################################################

leads

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Leads are customer-owned.

PropertyPilot enriches Leads with behavioral intelligence.

The platform does not merely store contact information.

It continuously learns

Interests

Concerns

Buying signals

Communication preferences

Property preferences

Follow-up opportunities

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

primary_property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

crm_contact_id

TEXT

Nullable

External CRM identifier.

------------------------------------------------------------

first_name

TEXT

NOT NULL

------------------------------------------------------------

last_name

TEXT

NOT NULL

------------------------------------------------------------

email

TEXT

Nullable

------------------------------------------------------------

phone

TEXT

Nullable

E164

------------------------------------------------------------

preferred_contact

lead_contact_method_enum

EMAIL

PHONE

TEXT

ANY

------------------------------------------------------------

consent_email

BOOLEAN

Default FALSE

------------------------------------------------------------

consent_sms

BOOLEAN

Default FALSE

------------------------------------------------------------

consent_calls

BOOLEAN

Default FALSE

------------------------------------------------------------

lead_status

lead_status_enum

NEW

QUALIFIED

CONTACTED

SHOWING

OFFER

UNDER_CONTRACT

CLOSED

LOST

ARCHIVED

------------------------------------------------------------

lead_source

lead_source_enum

QR

MLS

WEBSITE

SOCIAL

EMAIL

TEXT

AGENT

OPEN_HOUSE

REFERRAL

------------------------------------------------------------

engagement_score

INTEGER

Default 0

Range

0–100

------------------------------------------------------------

intent_score

INTEGER

Default 0

Range

0–100

------------------------------------------------------------

fit_score

INTEGER

Default 0

Range

0–100

Measures alignment between buyer interests and the property.

------------------------------------------------------------

questions_asked

INTEGER

Default 0

------------------------------------------------------------

sessions_count

INTEGER

Default 1

------------------------------------------------------------

favorite_assets

JSONB

Nullable

Ordered list of Asset IDs.

------------------------------------------------------------

last_activity_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

last_contacted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

next_followup_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

crm_sync_status

crm_sync_status_enum

PENDING

SYNCED

FAILED

DISCONNECTED

------------------------------------------------------------

notes

TEXT

Nullable

Agent-only.

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

deleted_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

email

Nullable

Unique when present.

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

primary_property_id

INDEX

email

INDEX

phone

INDEX

lead_status

INDEX

intent_score

INDEX

engagement_score

INDEX

fit_score

INDEX

last_activity_at

INDEX

next_followup_at

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

primary_property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Full Access

Listing Agent

Read

Update

CRM Users

Read

Marketing Users

Read

Anonymous

No Access

Personally identifiable information is never exposed publicly.

####################################################################

TRIGGERS

####################################################################

Lead Created

Queue CRM Sync

------------------------------------------------------------

Lead Updated

Recalculate

Intent

Engagement

Fit Score

------------------------------------------------------------

Lead Converted

Publish LeadQualified

Audit Change

####################################################################

RELATED TABLES

####################################################################

visitor_sessions

buyer_questions

voice_sessions

crm_connections

analytics_events

followups

showings

####################################################################

EVENTS

####################################################################

LeadCreated

LeadUpdated

LeadQualified

LeadSynced

LeadArchived

FollowupScheduled

####################################################################

REPOSITORY

####################################################################

LeadRepository

Methods

create()

update()

merge()

find()

findByEmail()

findByPhone()

calculateIntent()

calculateFit()

scheduleFollowup()

syncCRM()

archive()

####################################################################

TYPESCRIPT

####################################################################

interface Lead {

id:string;

organizationId:string;

primaryPropertyId?:string;

crmContactId?:string;

firstName:string;

lastName:string;

email?:string;

phone?:string;

preferredContact:LeadContactMethod;

consentEmail:boolean;

consentSms:boolean;

consentCalls:boolean;

leadStatus:LeadStatus;

leadSource:LeadSource;

engagementScore:number;

intentScore:number;

fitScore:number;

questionsAsked:number;

sessionsCount:number;

favoriteAssets?:string[];

lastActivityAt?:Date;

lastContactedAt?:Date;

nextFollowupAt?:Date;

crmSyncStatus:CrmSyncStatus;

notes?:string;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

A Lead may have multiple Visitor Sessions.

A Lead may revisit multiple properties.

Intent Score recalculates continuously.

Fit Score considers viewed Assets, questions and engagement.

CRM synchronization is asynchronous.

Duplicate Leads should merge.

Archived Leads remain searchable for reporting.

####################################################################

PERFORMANCE NOTES

####################################################################

Leads power dashboards.

Indexes optimized for

Recent activity

Follow-up

CRM sync

Pipeline

Sales reporting

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Lead Created

Lead Updated

Lead Merged

CRM Sync

Follow-up Scheduled

Status Changed

Consent Changed

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The leads table transforms anonymous visitor behavior into

actionable buyer intelligence.

Rather than providing agents with a simple contact record,

PropertyPilot delivers a continuously evolving profile that

prioritizes the most engaged and most promising buyers.



10:02 AM

QR Code Scanned

↓

10:03

Started in Workshop

↓

10:05

Asked about insulation

↓

10:07

Viewed Electrical Panel

↓

10:10

Downloaded Workshop PDF

↓

10:13

Asked about HVAC

↓

10:15

Viewed Kitchen

↓

10:21

Requested Showing

↓

10:22

Entered Contact Information





####################################################################

TABLE

####################################################################

recommendations

####################################################################

PURPOSE

####################################################################

The recommendations table stores actionable suggestions generated

by PropertyPilot.

Recommendations are based on

Buyer behavior

Knowledge gaps

Property health

Marketing performance

AI confidence

Lead activity

Conversation analytics

System rules

Recommendations help users continuously improve both their

properties and their buyer experience.

####################################################################

TABLE NAME

####################################################################

recommendations

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Recommendations are generated by the Recommendation Engine.

Examples

Record a voice note explaining the workshop insulation.

Upload a photo of the electrical panel.

Add warranty information for the HVAC.

Update kitchen dimensions.

Answer frequently asked buyer questions.

Publish a new brochure.

Contact Lead #184 within 2 hours.

Every recommendation includes

Reason

Priority

Expected Impact

Confidence

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

UUID

Nullable

References

[assets.id](http://assets.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

recommendation_type

recommendation_type_enum

NOT NULL

Examples

Knowledge

Marketing

Lead

Photo

Voice

Maintenance

CRM

Follow-up

Publishing

Analytics

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

200 Characters

------------------------------------------------------------

description

TEXT

NOT NULL

------------------------------------------------------------

reason

TEXT

NOT NULL

Human-readable explanation.

------------------------------------------------------------

priority

recommendation_priority_enum

LOW

MEDIUM

HIGH

CRITICAL

------------------------------------------------------------

status

recommendation_status_enum

OPEN

DISMISSED

COMPLETED

EXPIRED

------------------------------------------------------------

confidence_score

NUMERIC(5,2)

Default

100

------------------------------------------------------------

estimated_impact_score

INTEGER

Default

50

Range

0–100

------------------------------------------------------------

estimated_time_minutes

INTEGER

Nullable

------------------------------------------------------------

evidence

JSONB

Nullable

Supporting analytics.

------------------------------------------------------------

generated_by

recommendation_source_enum

AI

RULE_ENGINE

SYSTEM

HYBRID

------------------------------------------------------------

expires_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

completed_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

dismissed_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

property_id

INDEX

asset_id

INDEX

lead_id

INDEX

priority

INDEX

status

INDEX

recommendation_type

INDEX

estimated_impact_score

INDEX

created_at

GIN INDEX

evidence

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

↓

[assets.id](http://assets.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Full Access

Listing Agent

Read

Complete

Dismiss

Office Manager

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Recommendation Created

Queue Notification

------------------------------------------------------------

Recommendation Completed

Recalculate Property Health

Recalculate Marketing Score

Audit Completion

------------------------------------------------------------

Recommendation Dismissed

Store dismissal reason

####################################################################

RELATED TABLES

####################################################################

analytics_events

properties

assets

leads

buyer_questions

knowledge_objects

notifications

####################################################################

EVENTS

####################################################################

RecommendationCreated

RecommendationCompleted

RecommendationDismissed

RecommendationExpired

####################################################################

REPOSITORY

####################################################################

RecommendationRepository

Methods

create()

update()

complete()

dismiss()

expire()

find()

findByProperty()

findByLead()

calculateImpact()

####################################################################

TYPESCRIPT

####################################################################

interface Recommendation {

id:string;

organizationId:string;

propertyId?:string;

assetId?:string;

leadId?:string;

recommendationType:RecommendationType;

title:string;

description:string;

reason:string;

priority:RecommendationPriority;

status:RecommendationStatus;

confidenceScore:number;

estimatedImpactScore:number;

estimatedTimeMinutes?:number;

evidence?:Record<string, unknown>;

generatedBy:RecommendationSource;

expiresAt?:Date;

completedAt?:Date;

dismissedAt?:Date;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Recommendations never execute automatically.

Users remain in control.

Every recommendation explains

Why

Impact

Evidence

Recommendations may be regenerated.

Dismissed recommendations remain in history.

Expired recommendations remain searchable.

####################################################################

EXAMPLE RECOMMENDATIONS

####################################################################

Upload a workshop photo.

Reason

16 buyers asked about electrical outlets.

Expected Impact

+4 Property Health

--------------------------------

Record HVAC maintenance history.

Reason

Confidence below target.

Expected Impact

+6 Knowledge Score

--------------------------------

Contact John Smith.

Reason

Intent Score 96.

Expected Impact

High conversion probability.

####################################################################

PERFORMANCE NOTES

####################################################################

Recommendation generation occurs asynchronously.

Dashboard reads current recommendations only.

Historical recommendations archived separately.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Recommendation Created

Completed

Dismissed

Expired

Regenerated

Evidence Changed

Every event immutable.

####################################################################

SUCCESS

####################################################################

The recommendations table transforms PropertyPilot from a passive

reporting system into an active coaching platform.

Instead of simply presenting analytics, the platform continuously

guides agents toward the actions most likely to improve buyer

experience, property quality and lead conversion.



####################################################################

TABLE

####################################################################

conversation_memory

####################################################################

PURPOSE

####################################################################

The conversation_memory table stores long-term AI memory derived

from buyer interactions.

Unlike raw conversation transcripts, memory contains durable,

high-value information that improves future conversations.

Examples

Buyer prefers workshops.

Buyer asked three questions about HVAC.

Buyer is concerned about maintenance costs.

Buyer likes large garages.

Buyer requested follow-up documents.

Memory is summarized, structured and continuously refined.

####################################################################

TABLE NAME

####################################################################

conversation_memory

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Conversation Memory represents persistent observations rather than

verbatim dialogue.

Each memory belongs to one Lead or one anonymous Visitor Session.

Memory survives across multiple visits.

AI uses Memory to personalize future conversations.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

visitor_session_id

UUID

Nullable

References

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

UUID

Nullable

References

[assets.id](http://assets.id)

------------------------------------------------------------

memory_type

conversation_memory_type_enum

Examples

Preference

Concern

Intent

Question

Fact

Behavior

FollowUp

Interest

Objection

Goal

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

200 Characters

------------------------------------------------------------

summary

TEXT

NOT NULL

Short natural-language memory.

------------------------------------------------------------

structured_data

JSONB

Nullable

Machine-readable representation.

------------------------------------------------------------

confidence_score

NUMERIC(5,2)

Default

100

------------------------------------------------------------

importance_score

INTEGER

Default

50

Range

0–100

------------------------------------------------------------

source_event_count

INTEGER

Default

1

------------------------------------------------------------

first_observed_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

last_observed_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

expires_at

TIMESTAMPTZ

Nullable

Optional automatic expiration.

------------------------------------------------------------

active

BOOLEAN

Default TRUE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

No strict uniqueness.

Multiple memories may exist for the same lead.

Similarity detection handled by AI.

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

lead_id

INDEX

visitor_session_id

INDEX

property_id

INDEX

asset_id

INDEX

memory_type

INDEX

importance_score

INDEX

last_observed_at

GIN INDEX

structured_data

FULL TEXT

title

summary

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

------------------------------------------------------------

visitor_session_id

↓

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

↓

[assets.id](http://assets.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Scoped

Listing Agent

Read

Editors

Read

Update

Anonymous

No Access

Conversation memory is never exposed to buyers.

####################################################################

TRIGGERS

####################################################################

After Conversation Ends

Queue Memory Extraction

------------------------------------------------------------

Memory Updated

Merge Similar Memories

Recalculate Importance

Audit Change

####################################################################

RELATED TABLES

####################################################################

visitor_sessions

voice_sessions

buyer_questions

analytics_events

leads

recommendations

####################################################################

EVENTS

####################################################################

MemoryCreated

MemoryUpdated

MemoryMerged

MemoryExpired

####################################################################

REPOSITORY

####################################################################

ConversationMemoryRepository

Methods

create()

merge()

update()

archive()

find()

findByLead()

findBySession()

findRelevant()

search()

expire()

####################################################################

TYPESCRIPT

####################################################################

interface ConversationMemory {

id:string;

organizationId:string;

leadId?:string;

visitorSessionId?:string;

propertyId?:string;

assetId?:string;

memoryType:ConversationMemoryType;

title:string;

summary:string;

structuredData?:Record<string, unknown>;

confidenceScore:number;

importanceScore:number;

sourceEventCount:number;

firstObservedAt:Date;

lastObservedAt:Date;

expiresAt?:Date;

active:boolean;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Memory stores observations, not transcripts.

Duplicate memories should merge.

Importance increases with repeated observations.

Expired memories remain archived.

AI retrieves relevant memories before generating responses.

Only high-confidence memories influence personalization.

####################################################################

PERFORMANCE NOTES

####################################################################

Memory retrieval must remain fast.

Only relevant memories are retrieved.

Similarity calculations performed asynchronously.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Memory Created

Memory Merged

Memory Updated

Memory Archived

Memory Expired

Every modification immutable.

####################################################################

SUCCESS

####################################################################

The conversation_memory table enables PropertyPilot to deliver

consistent, personalized buyer experiences across multiple visits.

Rather than treating each conversation independently, the platform

builds an evolving understanding of buyer interests and concerns

while preserving organizational knowledge.



####################################################################

TABLE

####################################################################

ai_requests

####################################################################

PURPOSE

####################################################################

The ai_requests table records every AI inference performed by

PropertyPilot.

This table provides

Auditability

Performance Monitoring

Cost Tracking

Quality Measurement

Prompt Versioning

Model Comparison

Every AI interaction is traceable.

####################################################################

TABLE NAME

####################################################################

ai_requests

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

One AI Request represents one inference.

Examples

Buyer asks a question

Generate brochure

Generate QR summary

Summarize workshop

Extract knowledge from voice note

Create maintenance timeline

Generate recommendations

Score buyer intent

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

UUID

Nullable

References

[assets.id](http://assets.id)

------------------------------------------------------------

visitor_session_id

UUID

Nullable

References

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

request_type

ai_request_type_enum

NOT NULL

Examples

VOICE_QA

TEXT_QA

KNOWLEDGE_EXTRACTION

SUMMARY

MARKETING

SCORING

TRANSLATION

OCR

CLASSIFICATION

------------------------------------------------------------

provider

ai_provider_enum

OPENAI

ANTHROPIC

GOOGLE

AZURE_OPENAI

------------------------------------------------------------

model

TEXT

NOT NULL

Example

gpt-5.5

------------------------------------------------------------

prompt_version

TEXT

NOT NULL

Example

voice_qa_v12

------------------------------------------------------------

system_prompt_id

UUID

Nullable

------------------------------------------------------------

temperature

NUMERIC(3,2)

------------------------------------------------------------

max_tokens

INTEGER

------------------------------------------------------------

input_tokens

INTEGER

Default 0

------------------------------------------------------------

output_tokens

INTEGER

Default 0

------------------------------------------------------------

total_tokens

INTEGER

Generated

------------------------------------------------------------

estimated_cost

NUMERIC(10,6)

------------------------------------------------------------

latency_ms

INTEGER

------------------------------------------------------------

retrieved_assets

INTEGER

Default 0

------------------------------------------------------------

retrieved_knowledge_objects

INTEGER

Default 0

------------------------------------------------------------

retrieved_facts

INTEGER

Default 0

------------------------------------------------------------

retrieved_memories

INTEGER

Default 0

------------------------------------------------------------

confidence_score

NUMERIC(5,2)

------------------------------------------------------------

hallucination_risk

INTEGER

Range

0–100

------------------------------------------------------------

response_approved

BOOLEAN

Default TRUE

------------------------------------------------------------

fallback_used

BOOLEAN

Default FALSE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

property_id

INDEX

request_type

INDEX

provider

INDEX

model

INDEX

created_at

INDEX

latency_ms

INDEX

estimated_cost

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

asset_id

↓

[assets.id](http://assets.id)

------------------------------------------------------------

visitor_session_id

↓

visitor_[sessions.id](http://sessions.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Owner

Read

Engineering

Diagnostics

Agents

Aggregated Metrics

Anonymous

No Access

Raw prompts and responses are not exposed through this table.

####################################################################

TRIGGERS

####################################################################

After Insert

Queue Cost Aggregation

Update Usage Dashboard

Update Organization AI Usage

####################################################################

RELATED TABLES

####################################################################

prompt_library

analytics_events

conversation_memory

knowledge_objects

billing_usage

####################################################################

EVENTS

####################################################################

AIRequestStarted

AIRequestCompleted

FallbackActivated

ModelSwitched

####################################################################

REPOSITORY

####################################################################

AIRequestRepository

Methods

record()

find()

findByProperty()

findByOrganization()

summarizeUsage()

calculateCosts()

findSlowRequests()

####################################################################

TYPESCRIPT

####################################################################

interface AIRequest {

id:string;

organizationId:string;

propertyId?:string;

assetId?:string;

visitorSessionId?:string;

leadId?:string;

requestType:AIRequestType;

provider:AIProvider;

model:string;

promptVersion:string;

systemPromptId?:string;

temperature:number;

maxTokens:number;

inputTokens:number;

outputTokens:number;

totalTokens:number;

estimatedCost:number;

latencyMs:number;

retrievedAssets:number;

retrievedKnowledgeObjects:number;

retrievedFacts:number;

retrievedMemories:number;

confidenceScore:number;

hallucinationRisk:number;

responseApproved:boolean;

fallbackUsed:boolean;

createdAt:Date;

}

####################################################################

BUSINESS RULES

####################################################################

Every AI request is logged.

Prompt versions are immutable.

Model changes are recorded.

Token usage tracked.

Cost tracked.

Fallbacks recorded.

Responses evaluated.

####################################################################

PERFORMANCE NOTES

####################################################################

Logging must not block inference.

Writes performed asynchronously.

Dashboards built from aggregates.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Prompt Version

Provider

Model

Latency

Cost

Fallback

Confidence

Every request permanently recorded.

####################################################################

SUCCESS

####################################################################

The ai_requests table provides complete operational visibility

into AI usage across PropertyPilot.

Every inference becomes measurable, auditable and optimizable,

allowing continuous improvements in quality, cost and performance.



####################################################################

TABLE

####################################################################

prompt_library

####################################################################

PURPOSE

####################################################################

The prompt_library table stores every AI prompt used throughout

PropertyPilot.

Prompts are managed independently from application code.

Prompts are versioned.

Prompts are testable.

Prompts are auditable.

Prompts are deployable.

Application code references Prompt IDs rather than embedding

prompt text.

####################################################################

TABLE NAME

####################################################################

prompt_library

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each Prompt performs one responsibility.

Examples

Voice Q&A

Knowledge Extraction

Voice Note Processing

Photo Analysis

Brochure Generation

Social Media

Buyer Scoring

Recommendation Engine

Conversation Memory

Property Summary

Timeline Builder

Translation

Prompts are reusable.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

Nullable

NULL indicates a system prompt.

Non-NULL indicates an organization override.

------------------------------------------------------------

prompt_key

TEXT

NOT NULL

Unique

Example

voice_qa

------------------------------------------------------------

version

INTEGER

NOT NULL

------------------------------------------------------------

title

TEXT

NOT NULL

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

purpose

TEXT

NOT NULL

Human-readable explanation.

------------------------------------------------------------

system_prompt

TEXT

NOT NULL

------------------------------------------------------------

developer_prompt

TEXT

Nullable

------------------------------------------------------------

response_schema

JSONB

Nullable

Expected structured output.

------------------------------------------------------------

preferred_provider

ai_provider_enum

------------------------------------------------------------

preferred_model

TEXT

Nullable

------------------------------------------------------------

temperature

NUMERIC(3,2)

Default

0.2

------------------------------------------------------------

max_tokens

INTEGER

Default

4000

------------------------------------------------------------

enabled

BOOLEAN

Default TRUE

------------------------------------------------------------

production

BOOLEAN

Default TRUE

------------------------------------------------------------

allow_ab_testing

BOOLEAN

Default FALSE

------------------------------------------------------------

success_rate

NUMERIC(5,2)

Default

0

------------------------------------------------------------

average_latency_ms

INTEGER

Default

0

------------------------------------------------------------

average_cost

NUMERIC(10,6)

Default

0

------------------------------------------------------------

usage_count

BIGINT

Default

0

------------------------------------------------------------

last_used_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

UUID

References

[profiles.id](http://profiles.id)

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

prompt_key

+

version

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

prompt_key

INDEX

organization_id

INDEX

version

INDEX

enabled

INDEX

production

INDEX

preferred_provider

INDEX

preferred_model

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

updated_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Engineering

Read

Write

Organization Owner

Read

Override

Agents

No Access

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Prompt Published

Invalidate Prompt Cache

------------------------------------------------------------

Prompt Disabled

Prevent New Requests

------------------------------------------------------------

Prompt Updated

Increment Version

Audit Change

####################################################################

RELATED TABLES

####################################################################

ai_requests

prompt_tests

prompt_evaluations

audit_log

####################################################################

EVENTS

####################################################################

PromptCreated

PromptPublished

PromptDisabled

PromptArchived

PromptVersionCreated

####################################################################

REPOSITORY

####################################################################

PromptRepository

Methods

create()

publish()

disable()

archive()

duplicate()

find()

findActive()

findLatest()

compare()

rollback()

####################################################################

TYPESCRIPT

####################################################################

interface Prompt {

id:string;

organizationId?:string;

promptKey:string;

version:number;

title:string;

description?:string;

purpose:string;

systemPrompt:string;

developerPrompt?:string;

responseSchema?:Record<string,unknown>;

preferredProvider:AIProvider;

preferredModel?:string;

temperature:number;

maxTokens:number;

enabled:boolean;

production:boolean;

allowAbTesting:boolean;

successRate:number;

averageLatencyMs:number;

averageCost:number;

usageCount:number;

lastUsedAt?:Date;

createdAt:Date;

updatedAt:Date;

}

####################################################################

BUSINESS RULES

####################################################################

Prompt text is never edited in place.

Every change creates a new version.

Production prompts require approval.

Only one production version may be active for a prompt key.

Organization overrides inherit from system prompts unless explicitly replaced.

A/B testing is optional.

####################################################################

PERFORMANCE NOTES

####################################################################

Prompts loaded from cache.

Cache invalidated on publish.

Application never reads prompt files from disk.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Prompt Created

Prompt Published

Prompt Disabled

Prompt Rolled Back

Model Changed

Provider Changed

Every version permanent.

####################################################################

SUCCESS

####################################################################

The prompt_library table becomes the operational control center

for every AI capability in PropertyPilot.

Prompt engineering becomes measurable, testable, versioned and

deployable without requiring application releases.



####################################################################

TABLE

####################################################################

jobs

####################################################################

PURPOSE

####################################################################

The jobs table manages every asynchronous task executed by

PropertyPilot.

Long-running operations are never performed during a user request.

Instead, work is queued, processed and monitored through the Job

system.

Examples

Generate brochure

Extract voice knowledge

Analyze photographs

Generate embeddings

Calculate buyer intent

Regenerate recommendations

CRM synchronization

Email delivery

Property health calculation

Timeline rebuilding

####################################################################

TABLE NAME

####################################################################

jobs

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Jobs are durable.

Jobs survive restarts.

Jobs are retryable.

Jobs are observable.

Jobs are idempotent.

The queue system guarantees reliable background processing.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

Nullable

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

job_type

job_type_enum

NOT NULL

Examples

VOICE_EXTRACTION

PHOTO_ANALYSIS

EMBEDDING

BROCHURE

SOCIAL_MEDIA

EMAIL

CRM_SYNC

RECOMMENDATION

PROPERTY_HEALTH

AI_SUMMARY

TIMELINE

EXPORT

IMPORT

------------------------------------------------------------

status

job_status_enum

Default

QUEUED

Values

QUEUED

RUNNING

COMPLETED

FAILED

CANCELLED

RETRYING

------------------------------------------------------------

priority

job_priority_enum

LOW

NORMAL

HIGH

CRITICAL

------------------------------------------------------------

payload

JSONB

NOT NULL

Job parameters.

------------------------------------------------------------

result

JSONB

Nullable

Execution result.

------------------------------------------------------------

progress_percent

INTEGER

Default

0

Range

0–100

------------------------------------------------------------

attempt_count

INTEGER

Default

0

------------------------------------------------------------

max_attempts

INTEGER

Default

5

------------------------------------------------------------

error_message

TEXT

Nullable

------------------------------------------------------------

error_stack

TEXT

Nullable

Development only.

------------------------------------------------------------

scheduled_for

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

started_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

completed_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

execution_time_ms

INTEGER

Nullable

------------------------------------------------------------

worker_name

TEXT

Nullable

------------------------------------------------------------

correlation_id

UUID

Nullable

Links related jobs.

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

job_type

INDEX

status

INDEX

priority

INDEX

scheduled_for

INDEX

started_at

INDEX

correlation_id

GIN INDEX

payload

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Operations

Read

Retry

Cancel

Organization Members

Read Own Jobs

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Job Created

Queue Worker

------------------------------------------------------------

Job Completed

Publish JobCompleted

------------------------------------------------------------

Job Failed

Retry if eligible

Publish JobFailed

####################################################################

RELATED TABLES

####################################################################

notifications

analytics_events

audit_log

recommendations

ai_requests

####################################################################

EVENTS

####################################################################

JobQueued

JobStarted

JobCompleted

JobFailed

JobRetried

JobCancelled

####################################################################

REPOSITORY

####################################################################

JobRepository

Methods

enqueue()

claim()

complete()

fail()

retry()

cancel()

find()

findRunning()

findFailed()

archive()

####################################################################

TYPESCRIPT

####################################################################

interface Job {

id:string;

organizationId?:string;

jobType:JobType;

status:JobStatus;

priority:JobPriority;

payload:Record<string,unknown>;

result?:Record<string,unknown>;

progressPercent:number;

attemptCount:number;

maxAttempts:number;

errorMessage?:string;

errorStack?:string;

scheduledFor:Date;

startedAt?:Date;

completedAt?:Date;

executionTimeMs?:number;

workerName?:string;

correlationId?:string;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Jobs must be idempotent.

Jobs may be retried.

Completed jobs never execute again.

Cancelled jobs remain in history.

Retries use exponential backoff.

Long-running jobs report progress.

Dependent jobs use correlation IDs.

####################################################################

PERFORMANCE NOTES

####################################################################

Workers poll efficiently.

Queue processing scales horizontally.

Large payloads should be referenced rather than embedded.

Completed jobs archived according to retention policy.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Job Queued

Started

Completed

Failed

Retried

Cancelled

Execution Time

Worker

Every transition immutable.

####################################################################

SUCCESS

####################################################################

The jobs table provides reliable background execution for every

long-running process within PropertyPilot.

It enables responsive user experiences while ensuring complex

operations complete safely, observably and at scale.



####################################################################

TABLE

####################################################################

workflows

####################################################################

PURPOSE

####################################################################

The workflows table represents orchestrated business processes.

A Workflow coordinates multiple background Jobs into a single,

trackable business operation.

Examples

Publish Property

Import Property

Generate Marketing Package

Process Voice Notes

Build Digital Property Twin

Buyer Follow-up

CRM Synchronization

Open House Preparation

Knowledge Verification

Workflow execution is durable, observable and resumable.

####################################################################

TABLE NAME

####################################################################

workflows

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

One Workflow contains one or more Workflow Steps.

Each step may create one or more Jobs.

Workflows may execute

Sequentially

In Parallel

Conditionally

With Retries

With Compensation

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

Nullable

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

workflow_type

workflow_type_enum

NOT NULL

Examples

PROPERTY_PUBLISH

PROPERTY_IMPORT

VOICE_PROCESSING

PHOTO_ANALYSIS

CRM_SYNC

BROCHURE_GENERATION

BUYER_FOLLOWUP

EXPORT

IMPORT

------------------------------------------------------------

status

workflow_status_enum

Default

PENDING

Allowed

PENDING

RUNNING

WAITING

COMPLETED

FAILED

CANCELLED

PARTIALLY_COMPLETED

------------------------------------------------------------

current_step

TEXT

Nullable

------------------------------------------------------------

progress_percent

INTEGER

Default

0

------------------------------------------------------------

total_steps

INTEGER

Default

0

------------------------------------------------------------

completed_steps

INTEGER

Default

0

------------------------------------------------------------

failed_steps

INTEGER

Default

0

------------------------------------------------------------

started_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

completed_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

execution_time_ms

BIGINT

Nullable

------------------------------------------------------------

trigger_type

workflow_trigger_enum

Allowed

USER

SYSTEM

WEBHOOK

SCHEDULE

API

------------------------------------------------------------

trigger_reference

TEXT

Nullable

------------------------------------------------------------

retry_count

INTEGER

Default

0

------------------------------------------------------------

last_error

TEXT

Nullable

------------------------------------------------------------

metadata

JSONB

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_by

UUID

Nullable

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

property_id

INDEX

workflow_type

INDEX

status

INDEX

started_at

INDEX

completed_at

GIN INDEX

metadata

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

created_by

↓

[profiles.id](http://profiles.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Operations

Read

Retry

Cancel

Organization Members

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Workflow Started

Queue First Step

------------------------------------------------------------

Step Completed

Evaluate Next Step

------------------------------------------------------------

Workflow Failed

Generate Incident

------------------------------------------------------------

Workflow Completed

Publish WorkflowCompleted

####################################################################

RELATED TABLES

####################################################################

workflow_steps

jobs

analytics_events

notifications

audit_log

####################################################################

EVENTS

####################################################################

WorkflowStarted

WorkflowPaused

WorkflowResumed

WorkflowCompleted

WorkflowFailed

WorkflowCancelled

####################################################################

REPOSITORY

####################################################################

WorkflowRepository

Methods

create()

start()

pause()

resume()

cancel()

retry()

complete()

find()

findRunning()

findFailed()

####################################################################

TYPESCRIPT

####################################################################

interface Workflow {

id:string;

organizationId?:string;

propertyId?:string;

workflowType:WorkflowType;

status:WorkflowStatus;

currentStep?:string;

progressPercent:number;

totalSteps:number;

completedSteps:number;

failedSteps:number;

startedAt?:Date;

completedAt?:Date;

executionTimeMs?:number;

triggerType:WorkflowTrigger;

triggerReference?:string;

retryCount:number;

lastError?:string;

metadata?:Record<string,unknown>;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Workflows coordinate Jobs.

Workflow state is durable.

Failed steps may retry.

Completed workflows are immutable.

Cancelled workflows retain history.

Progress updates after every completed step.

####################################################################

PERFORMANCE NOTES

####################################################################

Workflow orchestration must remain lightweight.

Individual work executes through Jobs.

Workflow state cached while active.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Workflow Started

Workflow Paused

Workflow Resumed

Workflow Failed

Workflow Cancelled

Workflow Completed

Duration

Trigger

Every transition immutable.

####################################################################

SUCCESS

####################################################################

The workflows table provides the orchestration layer for

PropertyPilot automation.

It coordinates complex multi-step business processes while

providing reliability, observability and operational resilience.



####################################################################

TABLE

####################################################################

notifications

####################################################################

PURPOSE

####################################################################

The notifications table manages all user-facing notifications

generated by PropertyPilot.

Notifications may be delivered through multiple channels while

maintaining a single authoritative record.

Supported delivery channels include

In-App

Email

SMS

Push

Webhook

Slack

Microsoft Teams

Future channels

Notifications are event-driven.

####################################################################

TABLE NAME

####################################################################

notifications

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Notifications inform users about important events.

Examples

Lead Captured

Buyer Requested Showing

Workflow Failed

Property Published

Knowledge Gap Detected

Recommendation Generated

CRM Sync Failed

Subscription Expiring

AI Usage Limit Approaching

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

profile_id

UUID

NOT NULL

References

[profiles.id](http://profiles.id)

------------------------------------------------------------

workflow_id

UUID

Nullable

References

[workflows.id](http://workflows.id)

------------------------------------------------------------

job_id

UUID

Nullable

References

[jobs.id](http://jobs.id)

------------------------------------------------------------

property_id

UUID

Nullable

References

[properties.id](http://properties.id)

------------------------------------------------------------

lead_id

UUID

Nullable

References

[leads.id](http://leads.id)

------------------------------------------------------------

notification_type

notification_type_enum

NOT NULL

Examples

SYSTEM

LEAD

PROPERTY

WORKFLOW

AI

CRM

MARKETING

SECURITY

BILLING

------------------------------------------------------------

priority

notification_priority_enum

LOW

NORMAL

HIGH

CRITICAL

------------------------------------------------------------

title

TEXT

NOT NULL

Maximum

200 Characters

------------------------------------------------------------

message

TEXT

NOT NULL

------------------------------------------------------------

action_url

TEXT

Nullable

------------------------------------------------------------

action_label

TEXT

Nullable

Example

View Lead

------------------------------------------------------------

delivery_channels

TEXT[]

Examples

APP

EMAIL

SMS

------------------------------------------------------------

delivery_status

notification_delivery_status_enum

PENDING

QUEUED

SENT

FAILED

READ

------------------------------------------------------------

read_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

sent_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

expires_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

metadata

JSONB

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

profile_id

INDEX

property_id

INDEX

lead_id

INDEX

priority

INDEX

delivery_status

INDEX

created_at

GIN INDEX

metadata

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

profile_id

↓

[profiles.id](http://profiles.id)

------------------------------------------------------------

workflow_id

↓

[workflows.id](http://workflows.id)

------------------------------------------------------------

job_id

↓

[jobs.id](http://jobs.id)

------------------------------------------------------------

property_id

↓

[properties.id](http://properties.id)

------------------------------------------------------------

lead_id

↓

[leads.id](http://leads.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Organization Members

Own Organization

Users

Own Notifications

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Notification Created

Queue Delivery

------------------------------------------------------------

Notification Read

Update Metrics

------------------------------------------------------------

Delivery Failed

Retry

####################################################################

RELATED TABLES

####################################################################

jobs

workflows

leads

properties

analytics_events

####################################################################

EVENTS

####################################################################

NotificationCreated

NotificationSent

NotificationRead

NotificationExpired

NotificationFailed

####################################################################

REPOSITORY

####################################################################

NotificationRepository

Methods

create()

send()

markRead()

retry()

expire()

archive()

find()

findUnread()

dismiss()

####################################################################

TYPESCRIPT

####################################################################

interface Notification {

id:string;

organizationId:string;

profileId:string;

workflowId?:string;

jobId?:string;

propertyId?:string;

leadId?:string;

notificationType:NotificationType;

priority:NotificationPriority;

title:string;

message:string;

actionUrl?:string;

actionLabel?:string;

deliveryChannels:string[];

deliveryStatus:NotificationDeliveryStatus;

readAt?:Date;

sentAt?:Date;

expiresAt?:Date;

metadata?:Record<string,unknown>;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Notifications are immutable after delivery.

Delivery retries are automatic.

Expired notifications remain in history.

Users control notification preferences.

Critical notifications bypass digest mode.

####################################################################

PERFORMANCE NOTES

####################################################################

Notification delivery handled asynchronously.

Delivery receipts stored separately.

Dashboard queries read only active notifications.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Notification Created

Sent

Failed

Retried

Read

Expired

Dismissed

Every event immutable.

####################################################################

SUCCESS

####################################################################

The notifications table provides a unified communication layer

for PropertyPilot, ensuring users are informed of important

events through their preferred delivery channels while maintaining

complete delivery history.



####################################################################

TABLE

####################################################################

subscriptions

####################################################################

PURPOSE

####################################################################

The subscriptions table manages commercial access to

PropertyPilot.

Subscriptions determine

Features

Usage Limits

Storage

AI Credits

Seat Counts

Billing Status

This table is synchronized with Stripe but remains the canonical

application representation of customer entitlement.

####################################################################

TABLE NAME

####################################################################

subscriptions

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each Organization may own multiple subscriptions.

Examples

PropertyPilot Professional

PropertyPilot Enterprise

Future Add-ons

AI Credit Packs

Additional Storage

Voice Packs

Subscriptions determine platform capabilities.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

stripe_customer_id

TEXT

NOT NULL

------------------------------------------------------------

stripe_subscription_id

TEXT

Nullable

------------------------------------------------------------

stripe_price_id

TEXT

NOT NULL

------------------------------------------------------------

plan_key

TEXT

NOT NULL

Examples

starter

professional

brokerage

enterprise

------------------------------------------------------------

plan_name

TEXT

NOT NULL

------------------------------------------------------------

status

subscription_status_enum

Allowed

TRIAL

ACTIVE

PAST_DUE

PAUSED

CANCELLED

EXPIRED

------------------------------------------------------------

billing_interval

billing_interval_enum

MONTHLY

YEARLY

ONE_TIME

------------------------------------------------------------

current_period_start

TIMESTAMPTZ

------------------------------------------------------------

current_period_end

TIMESTAMPTZ

------------------------------------------------------------

trial_ends_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

cancel_at_period_end

BOOLEAN

Default FALSE

------------------------------------------------------------

seats_allowed

INTEGER

Default 1

------------------------------------------------------------

properties_allowed

INTEGER

Default 25

------------------------------------------------------------

storage_gb_allowed

INTEGER

Default 5

------------------------------------------------------------

monthly_ai_tokens

BIGINT

Default 0

------------------------------------------------------------

monthly_voice_minutes

INTEGER

Default 0

------------------------------------------------------------

monthly_exports

INTEGER

Default 0

------------------------------------------------------------

features

JSONB

Nullable

Feature entitlement map.

------------------------------------------------------------

last_webhook_at

TIMESTAMPTZ

Nullable

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

UNIQUE

stripe_subscription_id

UNIQUE

stripe_customer_id

INDEX

status

INDEX

current_period_end

GIN INDEX

features

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Billing Administrators

Read

Manage

Organization Owner

Read

Organization Administrator

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Stripe Webhook

Update Subscription

------------------------------------------------------------

Subscription Changed

Recalculate Entitlements

------------------------------------------------------------

Subscription Expired

Disable Premium Features

####################################################################

RELATED TABLES

####################################################################

organizations

billing_events

feature_flags

notifications

analytics_events

####################################################################

EVENTS

####################################################################

SubscriptionCreated

SubscriptionActivated

SubscriptionRenewed

SubscriptionCancelled

SubscriptionExpired

SubscriptionUpgraded

SubscriptionDowngraded

####################################################################

REPOSITORY

####################################################################

SubscriptionRepository

Methods

create()

activate()

renew()

cancel()

upgrade()

downgrade()

find()

findByOrganization()

syncStripe()

calculateEntitlements()

####################################################################

TYPESCRIPT

####################################################################

interface Subscription {

id:string;

organizationId:string;

stripeCustomerId:string;

stripeSubscriptionId?:string;

stripePriceId:string;

planKey:string;

planName:string;

status:SubscriptionStatus;

billingInterval:BillingInterval;

currentPeriodStart:Date;

currentPeriodEnd:Date;

trialEndsAt?:Date;

cancelAtPeriodEnd:boolean;

seatsAllowed:number;

propertiesAllowed:number;

storageGbAllowed:number;

monthlyAiTokens:number;

monthlyVoiceMinutes:number;

monthlyExports:number;

features?:Record<string,boolean>;

lastWebhookAt?:Date;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Stripe is the billing processor.

PropertyPilot determines feature entitlements.

Subscriptions may coexist.

Plan limits enforced centrally.

Webhooks are idempotent.

Feature changes take effect immediately.

####################################################################

PERFORMANCE NOTES

####################################################################

Subscription lookups occur during authentication.

Entitlements cached briefly.

Stripe webhooks processed asynchronously.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Subscription Created

Renewed

Upgraded

Downgraded

Cancelled

Expired

Webhook Processed

Every billing event immutable.

####################################################################

SUCCESS

####################################################################

The subscriptions table provides the entitlement layer for

PropertyPilot, separating billing concerns from organizational

identity while supporting flexible pricing, feature management

and future commercial expansion.



####################################################################

TABLE

####################################################################

features

####################################################################

PURPOSE

####################################################################

The features table defines every capability available within

PropertyPilot.

Features are the fundamental unit of entitlement.

Plans grant Features.

Feature Packs grant Features.

Organization Overrides grant Features.

Application code authorizes Features rather than Subscription Plans.

####################################################################

TABLE NAME

####################################################################

features

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each Feature represents one capability.

Examples

AI Voice Tours

QR Property Experience

Unlimited Properties

Digital Property Twin

CRM Synchronization

Buyer Intelligence

Marketing Generator

Brochure Generator

Timeline

Translation

White Label

API Access

Commercial Edition

Luxury Marketing

Future capabilities are added here.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

feature_key

TEXT

NOT NULL

UNIQUE

Example

[voice.tours](http://voice.tours)

------------------------------------------------------------

display_name

TEXT

NOT NULL

------------------------------------------------------------

description

TEXT

Nullable

------------------------------------------------------------

category

feature_category_enum

Examples

VOICE

AI

MARKETING

CRM

ANALYTICS

ADMINISTRATION

EXPORT

IMPORT

SECURITY

BILLING

API

MOBILE

------------------------------------------------------------

feature_type

feature_type_enum

Allowed

BOOLEAN

LIMIT

METERED

CONFIGURATION

------------------------------------------------------------

default_enabled

BOOLEAN

Default FALSE

------------------------------------------------------------

default_limit

BIGINT

Nullable

Used for

Minutes

Credits

Exports

Properties

Users

------------------------------------------------------------

unit

TEXT

Nullable

Examples

minutes

credits

properties

users

exports

------------------------------------------------------------

internal_only

BOOLEAN

Default FALSE

------------------------------------------------------------

beta

BOOLEAN

Default FALSE

------------------------------------------------------------

deprecated

BOOLEAN

Default FALSE

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

INDEXES

####################################################################

PRIMARY

id

UNIQUE

feature_key

INDEX

category

INDEX

feature_type

INDEX

beta

INDEX

deprecated

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Create

Update

Archive

Engineering

Read

Organization Users

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Feature Created

Publish FeatureAdded

------------------------------------------------------------

Feature Updated

Invalidate Feature Cache

------------------------------------------------------------

Feature Deprecated

Notify Engineering

####################################################################

RELATED TABLES

####################################################################

plans

plan_features

organization_feature_overrides

subscriptions

####################################################################

EVENTS

####################################################################

FeatureCreated

FeatureUpdated

FeatureDeprecated

FeatureEnabled

FeatureDisabled

####################################################################

REPOSITORY

####################################################################

FeatureRepository

Methods

create()

update()

archive()

find()

findByKey()

list()

search()

####################################################################

TYPESCRIPT

####################################################################

interface Feature {

id:string;

featureKey:string;

displayName:string;

description?:string;

category:FeatureCategory;

featureType:FeatureType;

defaultEnabled:boolean;

defaultLimit?:number;

unit?:string;

internalOnly:boolean;

beta:boolean;

deprecated:boolean;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

Feature Keys never change.

Deprecated Features remain available for history.

Application code checks Features.

Application code never checks Plans.

Every new capability becomes a Feature.

####################################################################

PERFORMANCE NOTES

####################################################################

Feature catalog is small.

Safe for application startup cache.

Authorization resolves Features once per request.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Feature Created

Feature Modified

Feature Deprecated

Feature Restored

Every change immutable.

####################################################################

SUCCESS

####################################################################

The features table becomes the canonical capability catalog for

PropertyPilot.

It decouples application behavior from pricing plans, enabling

flexible commercial packaging, cleaner authorization and long-term

maintainability.



####################################################################

TABLE

####################################################################

organization_entitlements

####################################################################

PURPOSE

####################################################################

The organization_entitlements table represents the effective

capabilities currently available to an Organization.

This table is materialized from

Subscriptions

Plans

Plan Features

Feature Packs

Organization Overrides

Promotions

Trials

Beta Programs

Enterprise Contracts

Application code should never calculate entitlements at runtime.

Instead, it queries this table through the Entitlement Service.

####################################################################

TABLE NAME

####################################################################

organization_entitlements

####################################################################

PRIMARY KEY

####################################################################

id UUID

Primary Key

UUID v7

####################################################################

DESCRIPTION

####################################################################

Each record represents one effective feature for one organization.

Examples

[voice.tours](http://voice.tours) = enabled

properties.limit = 250

ai.monthly_tokens = 500000

white_label = enabled

translation = disabled

commercial_edition = enabled

This table is regenerated whenever commercial state changes.

####################################################################

COLUMNS

####################################################################

id

UUID

PRIMARY KEY

------------------------------------------------------------

organization_id

UUID

NOT NULL

References

[organizations.id](http://organizations.id)

------------------------------------------------------------

feature_id

UUID

NOT NULL

References

[features.id](http://features.id)

------------------------------------------------------------

enabled

BOOLEAN

NOT NULL

------------------------------------------------------------

effective_limit

BIGINT

Nullable

------------------------------------------------------------

effective_value

TEXT

Nullable

Used for configuration values.

------------------------------------------------------------

source

entitlement_source_enum

PLAN

ADDON

OVERRIDE

TRIAL

PROMOTION

ENTERPRISE

SYSTEM

------------------------------------------------------------

source_reference

TEXT

Nullable

Stripe ID

Promotion ID

Contract ID

------------------------------------------------------------

effective_from

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

effective_until

TIMESTAMPTZ

Nullable

------------------------------------------------------------

reason

TEXT

Nullable

Human explanation.

------------------------------------------------------------

last_recalculated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

created_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

updated_at

TIMESTAMPTZ

Default NOW()

------------------------------------------------------------

version

INTEGER

Default 1

####################################################################

UNIQUE CONSTRAINTS

####################################################################

organization_id

+

feature_id

UNIQUE

####################################################################

INDEXES

####################################################################

PRIMARY

id

INDEX

organization_id

INDEX

feature_id

INDEX

enabled

INDEX

effective_until

INDEX

last_recalculated_at

####################################################################

FOREIGN KEYS

####################################################################

organization_id

↓

[organizations.id](http://organizations.id)

------------------------------------------------------------

feature_id

↓

[features.id](http://features.id)

####################################################################

ROW LEVEL SECURITY

####################################################################

Enabled

Platform Administrator

Full Access

Billing Administrators

Read

Recalculate

Organization Owner

Read

Organization Administrator

Read

Anonymous

No Access

####################################################################

TRIGGERS

####################################################################

Subscription Updated

Rebuild Entitlements

------------------------------------------------------------

Feature Override Updated

Rebuild Entitlements

------------------------------------------------------------

Promotion Applied

Rebuild Entitlements

------------------------------------------------------------

Entitlements Updated

Invalidate Cache

####################################################################

RELATED TABLES

####################################################################

subscriptions

features

plans

organization_feature_overrides

audit_log

####################################################################

EVENTS

####################################################################

EntitlementsCalculated

EntitlementsUpdated

EntitlementsExpired

####################################################################

REPOSITORY

####################################################################

EntitlementRepository

Methods

calculate()

rebuild()

find()

findByOrganization()

findFeature()

isEnabled()

getLimit()

invalidateCache()

####################################################################

TYPESCRIPT

####################################################################

interface OrganizationEntitlement {

id:string;

organizationId:string;

featureId:string;

enabled:boolean;

effectiveLimit?:number;

effectiveValue?:string;

source:EntitlementSource;

sourceReference?:string;

effectiveFrom:Date;

effectiveUntil?:Date;

reason?:string;

lastRecalculatedAt:Date;

createdAt:Date;

updatedAt:Date;

version:number;

}

####################################################################

BUSINESS RULES

####################################################################

One entitlement per feature.

Entitlements are regenerated.

Never edited manually.

Runtime authorization reads this table.

Expired entitlements ignored.

Cache invalidated automatically.

####################################################################

PERFORMANCE NOTES

####################################################################

This table is read constantly.

Must remain small.

Highly cacheable.

Lookups must complete in milliseconds.

####################################################################

AUDIT REQUIREMENTS

####################################################################

Log

Entitlements Calculated

Promotion Applied

Override Applied

Expiration

Manual Rebuild

Every recalculation immutable.

####################################################################

SUCCESS

####################################################################

The organization_entitlements table provides the single source of

truth for effective platform capabilities.

It isolates commercial logic from application logic, enabling

high-performance authorization while supporting flexible pricing,

enterprise contracts and future product expansion.



