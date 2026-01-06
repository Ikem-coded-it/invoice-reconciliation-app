// server/src/db/schema.ts
import { pgTable, uuid, text, decimal, timestamp, boolean, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- RLS Helper ---
// This enables RLS on the table. The policy checks if the current_setting matches the tenant_id.
// Note: In a real migration, you must enable RLS using raw SQL: "ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;"
const tenantPolicy = sql`(select current_setting('app.current_tenant_id'))::uuid = tenant_id`;

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  amount: decimal('amount').notNull(),
  description: text('description'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  amount: text('amount').notNull(), // text prevents float errors
  currency: text('currency').default('USD'),
  description: text('description'),
  date: timestamp('posted_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});