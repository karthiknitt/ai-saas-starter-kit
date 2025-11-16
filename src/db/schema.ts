/**
 * Database schema definitions using Drizzle ORM.
 *
 * This module defines the PostgreSQL database schema for the AI SaaS application.
 * It includes tables for authentication, subscriptions, usage tracking, and audit logging.
 *
 * Schema Overview:
 * - **Authentication**: user, session, account, verification
 * - **Billing**: subscription
 * - **Usage Tracking**: usageLog, usageQuota
 * - **Audit Trail**: auditLog
 *
 * Relationships:
 * - User → Sessions (one-to-many)
 * - User → Accounts (one-to-many, for OAuth)
 * - User → Subscription (one-to-one)
 * - User → UsageLog (one-to-many)
 * - User → UsageQuota (one-to-one)
 * - User → AuditLog (one-to-many)
 *
 * @module db/schema
 * @see {@link https://orm.drizzle.team/docs Drizzle ORM Documentation}
 */

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * User role enumeration for RBAC (Role-Based Access Control).
 *
 * Roles:
 * - `viewer`: Read-only access to resources
 * - `member`: Standard user with default permissions
 * - `editor`: Can create and edit content
 * - `moderator`: Content moderation and user management capabilities
 * - `admin`: Full administrator with all permissions
 */
export const userRole = pgEnum('user_role', [
  'viewer',
  'member',
  'editor',
  'moderator',
  'admin',
]);

/**
 * User table - Core user profiles with authentication and configuration.
 *
 * Features:
 * - Email/password authentication
 * - OAuth account linking
 * - Encrypted API key storage
 * - AI provider selection (OpenAI/OpenRouter)
 * - Role-based access control
 *
 * @property {string} id - Unique user identifier (UUID)
 * @property {string} name - User's display name
 * @property {string} email - User's email address (unique)
 * @property {boolean} emailVerified - Whether email has been verified
 * @property {string | null} image - Profile image URL (optional)
 * @property {string | null} apiKeys - Encrypted API keys (AES-256-GCM encrypted JSON)
 * @property {string | null} provider - AI provider ('openai' or 'openrouter')
 * @property {string} role - User role ('member' or 'admin')
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp (auto-updated)
 *
 * Indexes:
 * - idx_user_role: For efficient role-based queries
 */
export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    apiKeys: text('api_keys'), // encrypted JSON string for API keys
    provider: text('provider'), // 'openai' or 'openrouter'
    // Role-based access control
    role: userRole('role').default('member').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    idxUserRole: index('idx_user_role').on(table.role),
  }),
);

/**
 * Session table - User authentication sessions.
 *
 * Manages active user sessions with automatic cleanup on user deletion.
 *
 * @property {string} id - Unique session identifier
 * @property {Date} expiresAt - Session expiration timestamp
 * @property {string} token - Session token (unique)
 * @property {Date} createdAt - Session creation timestamp
 * @property {Date} updatedAt - Last session update timestamp
 * @property {string | null} ipAddress - Client IP address (optional)
 * @property {string | null} userAgent - Client user agent (optional)
 * @property {string} userId - Associated user ID (foreign key, cascade delete)
 *
 * Indexes:
 * - idx_session_user_id: For efficient user session lookups
 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    idxSessionUserId: index('idx_session_user_id').on(table.userId),
  }),
);

/**
 * Account table - OAuth provider account linking.
 *
 * Links user accounts to external OAuth providers (Google, GitHub, etc.).
 * Supports multiple accounts per user.
 *
 * @property {string} id - Unique account identifier
 * @property {string} accountId - Provider-specific account ID
 * @property {string} providerId - OAuth provider identifier (e.g., 'google')
 * @property {string} userId - Associated user ID (foreign key, cascade delete)
 * @property {string | null} accessToken - OAuth access token (optional)
 * @property {string | null} refreshToken - OAuth refresh token (optional)
 * @property {string | null} idToken - OAuth ID token (optional)
 * @property {Date | null} accessTokenExpiresAt - Access token expiration (optional)
 * @property {Date | null} refreshTokenExpiresAt - Refresh token expiration (optional)
 * @property {string | null} scope - OAuth scope (optional)
 * @property {string | null} password - Hashed password for email/password auth (optional)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last account update timestamp
 */
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Verification table - Email verification and password reset tokens.
 *
 * Stores temporary verification codes for email verification and password reset flows.
 *
 * @property {string} id - Unique verification identifier
 * @property {string} identifier - Email or user identifier to verify
 * @property {string} value - Verification token/code
 * @property {Date} expiresAt - Token expiration timestamp
 * @property {Date} createdAt - Token creation timestamp
 * @property {Date} updatedAt - Last token update timestamp
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Subscription table - User subscription management via Polar.
 *
 * Tracks Polar subscription details and synchronizes with local application state.
 * Updated via webhooks from Polar.
 *
 * @property {string} id - Unique subscription identifier
 * @property {string} userId - Associated user ID (foreign key, cascade delete)
 * @property {string} polarSubscriptionId - Polar subscription ID (unique)
 * @property {string} polarCustomerId - Polar customer ID
 * @property {string} status - Subscription status ('active', 'canceled', 'past_due', etc.)
 * @property {string} plan - Subscription plan ('Free', 'Pro', 'Startup')
 * @property {Date | null} currentPeriodStart - Current billing period start (optional)
 * @property {Date | null} currentPeriodEnd - Current billing period end (optional)
 * @property {boolean} cancelAtPeriodEnd - Whether subscription cancels at period end
 * @property {Date} createdAt - Subscription creation timestamp
 * @property {Date} updatedAt - Last subscription update timestamp
 *
 * @see {@link /api/webhooks/polar Polar Webhook Handler}
 */
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  polarSubscriptionId: text('polar_subscription_id').notNull().unique(),
  polarCustomerId: text('polar_customer_id').notNull(),
  status: text('status').notNull(), // active, canceled, past_due, etc.
  plan: text('plan').notNull(), // Free, Pro, Startup
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Usage log table - Detailed tracking of resource usage.
 *
 * Records individual usage events for AI requests, API calls, and other resources.
 * Used for analytics, billing, and debugging.
 *
 * @property {string} id - Unique log entry identifier
 * @property {string} userId - Associated user ID (foreign key, cascade delete)
 * @property {string} resourceType - Resource type ('ai_request', 'api_call', 'storage')
 * @property {string | null} resourceId - Specific resource identifier (optional)
 * @property {string} quantity - Usage quantity (stored as text for flexibility, default: '1')
 * @property {string | null} metadata - Additional data as JSON string (optional)
 * @property {Date} timestamp - Usage event timestamp
 *
 * Indexes:
 * - idx_usage_user_id: For per-user usage queries
 * - idx_usage_timestamp: For time-based analytics
 * - idx_usage_resource_type: For resource-type filtering
 */
export const usageLog = pgTable(
  'usage_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    resourceType: text('resource_type').notNull(), // 'ai_request', 'api_call', 'storage'
    resourceId: text('resource_id'),
    quantity: text('quantity').default('1').notNull(), // Using text to store numbers for flexibility
    metadata: text('metadata'), // JSON string for additional data
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    idxUsageUserId: index('idx_usage_user_id').on(table.userId),
    idxUsageTimestamp: index('idx_usage_timestamp').on(table.timestamp),
    idxUsageResourceType: index('idx_usage_resource_type').on(
      table.resourceType,
    ),
  }),
);

/**
 * Usage quota table - Monthly usage limits and tracking.
 *
 * Maintains current usage and limits for each user based on their subscription plan.
 * Reset monthly on the user's billing cycle.
 *
 * @property {string} userId - Associated user ID (primary key, foreign key, cascade delete)
 * @property {string} aiRequestsUsed - AI requests used this period (stored as text)
 * @property {string} aiRequestsLimit - AI requests limit based on plan (stored as text)
 * @property {Date} resetAt - Next quota reset timestamp (monthly)
 * @property {Date} createdAt - Quota creation timestamp
 * @property {Date} updatedAt - Last quota update timestamp
 *
 * Plan Limits:
 * - Free: 10 requests/month
 * - Pro: 1000 requests/month
 * - Startup: 10000 requests/month
 *
 * @see {@link /lib/usage-tracker Usage Tracker}
 */
export const usageQuota = pgTable('usage_quota', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  aiRequestsUsed: text('ai_requests_used').default('0').notNull(), // Text to store numbers
  aiRequestsLimit: text('ai_requests_limit').notNull(),
  resetAt: timestamp('reset_at').notNull(),
  warning80Sent: boolean('warning_80_sent').default(false).notNull(), // 80% quota warning sent
  warning90Sent: boolean('warning_90_sent').default(false).notNull(), // 90% quota warning sent
  warning100Sent: boolean('warning_100_sent').default(false).notNull(), // 100% quota warning sent
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Audit log table - Security and compliance audit trail.
 *
 * Records all significant user actions for security monitoring and compliance.
 * Includes authentication events, subscription changes, and admin actions.
 *
 * @property {string} id - Unique audit log entry identifier
 * @property {string | null} userId - Associated user ID (foreign key, set null on delete)
 * @property {string} action - Action performed (e.g., 'login', 'subscription_updated', 'api_key_created')
 * @property {string | null} resourceType - Type of resource affected (optional)
 * @property {string | null} resourceId - Specific resource identifier (optional)
 * @property {string | null} changes - Before/after state as JSON string (optional)
 * @property {string | null} ipAddress - Client IP address (optional)
 * @property {string | null} userAgent - Client user agent (optional)
 * @property {Date} timestamp - Audit event timestamp
 *
 * Indexes:
 * - idx_audit_user_id: For per-user audit trails
 * - idx_audit_timestamp: For time-based queries
 * - idx_audit_action: For action-type filtering
 *
 * @see {@link /lib/audit-logger Audit Logger}
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    changes: text('changes'), // JSON string for before/after state
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    idxAuditUserId: index('idx_audit_user_id').on(table.userId),
    idxAuditTimestamp: index('idx_audit_timestamp').on(table.timestamp),
    idxAuditAction: index('idx_audit_action').on(table.action),
  }),
);

/**
 * Webhook event table - Webhook processing and retry management.
 *
 * Records all incoming webhook events for reliability and debugging.
 * Supports automatic retry with exponential backoff and dead letter queue.
 *
 * @property {string} id - Unique webhook event identifier
 * @property {string} source - Webhook source ('polar', 'stripe', etc.)
 * @property {string} eventType - Event type from webhook payload
 * @property {string} payload - Complete webhook payload as JSON string
 * @property {string} status - Processing status ('pending', 'processing', 'success', 'failed')
 * @property {number} retryCount - Number of retry attempts (default: 0)
 * @property {string | null} lastError - Last error message if processing failed
 * @property {Date | null} processedAt - Timestamp when successfully processed
 * @property {Date} createdAt - Webhook receipt timestamp
 *
 * Indexes:
 * - idx_webhook_status: For filtering by status and date
 *
 * @see {@link /lib/webhook-processor Webhook Processor}
 */
export const webhookEvent = pgTable(
  'webhook_event',
  {
    id: text('id').primaryKey(),
    source: text('source').notNull(), // 'polar', 'stripe', etc.
    eventType: text('event_type').notNull(),
    payload: text('payload').notNull(), // JSON string
    status: text('status').notNull(), // 'pending', 'processing', 'success', 'failed'
    retryCount: integer('retry_count').default(0).notNull(),
    lastError: text('last_error'),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxWebhookStatus: index('idx_webhook_status').on(
      table.status,
      table.createdAt,
    ),
  }),
);

/**
 * Workspace table - Multi-tenancy support for team workspaces.
 *
 * Enables B2B SaaS model where teams can collaborate within shared workspaces.
 * Each workspace has its own billing, members, and usage quotas.
 *
 * @property {string} id - Unique workspace identifier
 * @property {string} name - Workspace display name
 * @property {string} slug - URL-friendly workspace identifier (unique)
 * @property {string} ownerId - User ID of workspace owner (foreign key)
 * @property {string} plan - Workspace subscription plan ('Free', 'Pro', 'Startup')
 * @property {Date} createdAt - Workspace creation timestamp
 * @property {Date} updatedAt - Last workspace update timestamp
 *
 * Indexes:
 * - idx_workspace_owner: For owner-based workspace queries
 */
export const workspace = pgTable(
  'workspace',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull().default('Free'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    idxWorkspaceOwner: index('idx_workspace_owner').on(table.ownerId),
  }),
);

/**
 * Workspace role enumeration for workspace-level access control.
 *
 * Roles:
 * - `owner`: Workspace owner with full control
 * - `admin`: Workspace administrator with most permissions
 * - `member`: Standard workspace member
 * - `viewer`: Read-only access to workspace
 */
export const workspaceRole = pgEnum('workspace_role', [
  'owner',
  'admin',
  'member',
  'viewer',
]);

/**
 * Workspace member table - User membership in workspaces.
 *
 * Maps users to workspaces with role-based access control.
 * Supports multiple users per workspace and multiple workspaces per user.
 *
 * @property {string} workspaceId - Associated workspace ID (foreign key, cascade delete)
 * @property {string} userId - Associated user ID (foreign key, cascade delete)
 * @property {string} role - Workspace role ('owner', 'admin', 'member', 'viewer')
 * @property {Date} createdAt - Membership creation timestamp
 *
 * Indexes:
 * - idx_workspace_member_user: For user-based workspace lookups
 * - idx_workspace_member_workspace: For workspace-based member lookups
 */
export const workspaceMember = pgTable(
  'workspace_member',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: workspaceRole('role').notNull().default('member'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: {
      primaryKey: { columns: [table.workspaceId, table.userId] },
    },
    idxWorkspaceMemberUser: index('idx_workspace_member_user').on(table.userId),
    idxWorkspaceMemberWorkspace: index('idx_workspace_member_workspace').on(
      table.workspaceId,
    ),
  }),
);

/**
 * Permission table - Granular permissions for resource-level access control.
 *
 * Defines individual permissions that can be assigned to roles.
 * Permissions follow the format: resource:action (e.g., 'users:read', 'admin:access').
 *
 * @property {string} id - Unique permission identifier
 * @property {string} name - Unique permission name (e.g., 'users:read')
 * @property {string | null} description - Human-readable description
 * @property {string} resource - Resource type (e.g., 'users', 'billing', 'admin')
 * @property {string} action - Action type (e.g., 'read', 'write', 'delete')
 * @property {Date} createdAt - Permission creation timestamp
 *
 * Standard Permissions:
 * - users:read, users:write, users:delete
 * - billing:read, billing:manage
 * - admin:access
 * - audit:view
 * - content:moderate
 */
export const permission = pgTable('permission', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Role permission table - Maps permissions to roles.
 *
 * Defines which permissions are granted to each role.
 * Composite primary key prevents duplicate permission assignments.
 *
 * @property {string} role - User role from userRole enum
 * @property {string} permissionId - Associated permission ID (foreign key, cascade delete)
 *
 * Example Mappings:
 * - viewer: users:read, billing:read
 * - member: users:read, users:write, billing:read
 * - editor: users:read, users:write, billing:read, content:moderate
 * - moderator: users:read, users:write, users:delete, content:moderate
 * - admin: all permissions
 */
export const rolePermission = pgTable(
  'role_permission',
  {
    role: text('role').notNull(),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permission.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: {
      primaryKey: { columns: [table.role, table.permissionId] },
    },
  }),
);

/**
 * Complete database schema export.
 *
 * This object aggregates all table definitions for use with Drizzle ORM.
 * Import this in database migrations and queries.
 *
 * @example
 * ```typescript
 * import { schema } from './schema';
 * import { drizzle } from 'drizzle-orm/neon-http';
 *
 * const db = drizzle(client, { schema });
 * ```
 */
export const schema = {
  user,
  session,
  account,
  verification,
  subscription,
  usageLog,
  usageQuota,
  auditLog,
  webhookEvent,
  workspace,
  workspaceMember,
  permission,
  rolePermission,
  userRole,
  workspaceRole,
};
