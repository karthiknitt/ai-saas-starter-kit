import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// RBAC: define user_role enum with 'member' and 'admin'
export const userRole = pgEnum('user_role', ['member', 'admin']);

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

// Usage tracking tables
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

export const usageQuota = pgTable('usage_quota', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  aiRequestsUsed: text('ai_requests_used').default('0').notNull(), // Text to store numbers
  aiRequestsLimit: text('ai_requests_limit').notNull(),
  resetAt: timestamp('reset_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Audit logging table
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

export const schema = {
  user,
  session,
  account,
  verification,
  subscription,
  usageLog,
  usageQuota,
  auditLog,
  userRole,
};
