import { integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Agents created by users. The owner fields are a snapshot of the Vercel
 * identity at creation time (Sign in with Vercel keeps no users table).
 */
export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull(),
  cardLimitUsd: integer("card_limit_usd").notNull(),
  visibility: text("visibility").$type<"public" | "unlisted">().notNull().default("public"),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerImage: text("owner_image"),
  runsCount: integer("runs_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One completed turn of a user talking to an agent. */
export const runs = pgTable("runs", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  sessionId: text("session_id").notNull(),
  turnId: text("turn_id").notNull(),
  userId: text("user_id"),
  userName: text("user_name"),
  outcome: text("outcome").notNull(),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AgentRow = typeof agents.$inferSelect;
export type NewAgentRow = typeof agents.$inferInsert;
export type RunRow = typeof runs.$inferSelect;
export type NewRunRow = typeof runs.$inferInsert;
