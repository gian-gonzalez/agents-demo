/**
 * Data access for agents, runs and spend.
 *
 * With `DATABASE_URL` set (Neon on Vercel) everything goes to Postgres through
 * Drizzle. Without it (local `eve dev` / `next dev` before the database
 * exists) an in-memory store keeps the demo working; data is lost on restart.
 *
 * Shared by the Next.js app (pages, server actions) and the eve agent
 * (channel auth, dynamic instructions and tools, hooks).
 */
import { neon } from "@neondatabase/serverless";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { nanoid } from "nanoid";
import {
  agents,
  runs,
  spend,
  type AgentRow,
  type NewAgentRow,
  type NewRunRow,
  type NewSpendRow,
  type RunRow,
  type SpendRow,
} from "./schema";

export type Agent = AgentRow;
export type Run = RunRow;
export type Spend = SpendRow;

export interface CreateAgentInput {
  name: string;
  emoji: string;
  description: string;
  instructions: string;
  permissions: string[];
  cardLimitUsd: number;
  /** Monthly spending cap in USD across sessions; null or undefined = no cap. */
  monthlyBudgetUsd?: number | null;
  visibility: "public" | "unlisted";
  owner: { id: string; name: string; email: string; image?: string | null };
}

export interface RecordRunInput {
  agentId: string;
  sessionId: string;
  turnId: string;
  userId?: string | null;
  userName?: string | null;
  outcome: string;
  costUsd?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

export interface RecordSpendInput {
  agentId: string;
  sessionId: string;
  merchant: string;
  amountUsd: number;
  movementId?: string | null;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
  image: string | null;
  agentsCount: number;
  runsCount: number;
}

export interface Stats {
  agents: number;
  creators: number;
  runs: number;
}

export interface AgentsStore {
  readonly kind: "memory" | "postgres";
  createAgent(input: CreateAgentInput): Promise<Agent>;
  getAgent(id: string): Promise<Agent | null>;
  listAgents(options?: { ownerId?: string; limit?: number; includeUnlisted?: boolean }): Promise<Agent[]>;
  listCreators(): Promise<Creator[]>;
  recordRun(input: RecordRunInput): Promise<Run>;
  listRuns(agentId: string, limit?: number): Promise<Run[]>;
  recordSpend(input: RecordSpendInput): Promise<Spend>;
  /** USD spent by the agent since the start of the current calendar month (UTC). */
  monthlySpend(agentId: string, now?: Date): Promise<number>;
  stats(): Promise<Stats>;
}

/** First instant of the calendar month that contains `now`, in UTC. */
export function startOfMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function creatorsFrom(rows: Agent[]): Creator[] {
  const byOwner = new Map<string, Creator>();
  for (const row of rows) {
    const current = byOwner.get(row.ownerId) ?? {
      id: row.ownerId,
      name: row.ownerName,
      email: row.ownerEmail,
      image: row.ownerImage ?? null,
      agentsCount: 0,
      runsCount: 0,
    };
    current.agentsCount += 1;
    current.runsCount += row.runsCount;
    byOwner.set(row.ownerId, current);
  }
  return [...byOwner.values()].sort((a, b) => b.agentsCount - a.agentsCount);
}

function toAgentRow(input: CreateAgentInput): NewAgentRow {
  return {
    id: nanoid(10),
    name: input.name,
    emoji: input.emoji,
    description: input.description,
    instructions: input.instructions,
    permissions: input.permissions,
    cardLimitUsd: input.cardLimitUsd,
    monthlyBudgetUsd: input.monthlyBudgetUsd ?? null,
    visibility: input.visibility,
    ownerId: input.owner.id,
    ownerName: input.owner.name,
    ownerEmail: input.owner.email,
    ownerImage: input.owner.image ?? null,
  };
}

function toRunRow(input: RecordRunInput): NewRunRow {
  return {
    id: nanoid(12),
    agentId: input.agentId,
    sessionId: input.sessionId,
    turnId: input.turnId,
    userId: input.userId ?? null,
    userName: input.userName ?? null,
    outcome: input.outcome,
    costUsd: input.costUsd == null ? null : input.costUsd.toFixed(6),
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
  };
}

function toSpendRow(input: RecordSpendInput): NewSpendRow {
  return {
    id: nanoid(12),
    agentId: input.agentId,
    sessionId: input.sessionId,
    merchant: input.merchant,
    amountUsd: input.amountUsd.toFixed(2),
    movementId: input.movementId ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* In-memory store (local development without a database)             */
/* ------------------------------------------------------------------ */

function createMemoryStore(): AgentsStore {
  const agentRows: Agent[] = [];
  const runRows: Run[] = [];
  const spendRows: Spend[] = [];

  return {
    kind: "memory",
    async createAgent(input) {
      const row: Agent = {
        ...toAgentRow(input),
        monthlyBudgetUsd: input.monthlyBudgetUsd ?? null,
        visibility: input.visibility,
        ownerImage: input.owner.image ?? null,
        runsCount: 0,
        createdAt: new Date(),
      };
      agentRows.unshift(row);
      return row;
    },
    async getAgent(id) {
      return agentRows.find((a) => a.id === id) ?? null;
    },
    async listAgents({ ownerId, limit = 50, includeUnlisted = false } = {}) {
      return agentRows
        .filter((a) => (ownerId ? a.ownerId === ownerId : true))
        .filter((a) => includeUnlisted || ownerId || a.visibility === "public")
        .slice(0, limit);
    },
    async listCreators() {
      return creatorsFrom(agentRows.filter((a) => a.visibility === "public"));
    },
    async recordRun(input) {
      const row: Run = {
        ...toRunRow(input),
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        costUsd: input.costUsd == null ? null : input.costUsd.toFixed(6),
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        createdAt: new Date(),
      };
      runRows.unshift(row);
      const agent = agentRows.find((a) => a.id === input.agentId);
      if (agent) agent.runsCount += 1;
      return row;
    },
    async listRuns(agentId, limit = 20) {
      return runRows.filter((r) => r.agentId === agentId).slice(0, limit);
    },
    async recordSpend(input) {
      const row: Spend = { ...toSpendRow(input), movementId: input.movementId ?? null, createdAt: new Date() };
      spendRows.unshift(row);
      return row;
    },
    async monthlySpend(agentId, now = new Date()) {
      const since = startOfMonth(now).getTime();
      return spendRows
        .filter((s) => s.agentId === agentId && s.createdAt.getTime() >= since)
        .reduce((sum, s) => sum + Number(s.amountUsd), 0);
    },
    async stats() {
      const publicAgents = agentRows.filter((a) => a.visibility === "public");
      return {
        agents: publicAgents.length,
        creators: new Set(publicAgents.map((a) => a.ownerId)).size,
        runs: runRows.length,
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Postgres store (Neon on Vercel)                                     */
/* ------------------------------------------------------------------ */

function createPostgresStore(databaseUrl: string): AgentsStore {
  const db = drizzle(neon(databaseUrl));

  return {
    kind: "postgres",
    async createAgent(input) {
      const [row] = await db.insert(agents).values(toAgentRow(input)).returning();
      return row;
    },
    async getAgent(id) {
      const [row] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
      return row ?? null;
    },
    async listAgents({ ownerId, limit = 50, includeUnlisted = false } = {}) {
      const where = ownerId
        ? eq(agents.ownerId, ownerId)
        : includeUnlisted
          ? undefined
          : eq(agents.visibility, "public");
      const query = db.select().from(agents).orderBy(desc(agents.createdAt)).limit(limit);
      return where ? query.where(where) : query;
    },
    async listCreators() {
      const rows = await db.select().from(agents).where(eq(agents.visibility, "public"));
      return creatorsFrom(rows);
    },
    async recordRun(input) {
      const [row] = await db.insert(runs).values(toRunRow(input)).returning();
      await db
        .update(agents)
        .set({ runsCount: sql`${agents.runsCount} + 1` })
        .where(eq(agents.id, input.agentId));
      return row;
    },
    async listRuns(agentId, limit = 20) {
      return db.select().from(runs).where(eq(runs.agentId, agentId)).orderBy(desc(runs.createdAt)).limit(limit);
    },
    async recordSpend(input) {
      const [row] = await db.insert(spend).values(toSpendRow(input)).returning();
      return row;
    },
    async monthlySpend(agentId, now = new Date()) {
      const [result] = await db
        .select({ total: sql<string>`coalesce(sum(${spend.amountUsd}), 0)` })
        .from(spend)
        .where(and(eq(spend.agentId, agentId), gte(spend.createdAt, startOfMonth(now))));
      return Number(result?.total ?? 0);
    },
    async stats() {
      const [agentStats] = await db
        .select({
          agents: sql<number>`count(*)::int`,
          creators: sql<number>`count(distinct ${agents.ownerId})::int`,
        })
        .from(agents)
        .where(eq(agents.visibility, "public"));
      const [runStats] = await db.select({ runs: sql<number>`count(*)::int` }).from(runs);
      return { agents: agentStats?.agents ?? 0, creators: agentStats?.creators ?? 0, runs: runStats?.runs ?? 0 };
    },
  };
}

/* ------------------------------------------------------------------ */

let store: AgentsStore | undefined;

/** The process-wide store, chosen from the environment on first use. */
export function getStore(): AgentsStore {
  if (!store) {
    const url = process.env.DATABASE_URL;
    store = url ? createPostgresStore(url) : createMemoryStore();
  }
  return store;
}
