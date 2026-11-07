/**
 * Data access for agents and runs.
 *
 * With `DATABASE_URL` set (Neon on Vercel) everything goes to Postgres through
 * Drizzle. Without it (local `eve dev` / `next dev` before the database
 * exists) an in-memory store keeps the demo working; data is lost on restart.
 *
 * Shared by the Next.js app (pages, server actions) and the eve agent
 * (channel auth, dynamic instructions and tools, hooks).
 */
import { neon } from "@neondatabase/serverless";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { nanoid } from "nanoid";
import { agents, runs, type AgentRow, type NewAgentRow, type NewRunRow, type RunRow } from "./schema";

export type Agent = AgentRow;
export type Run = RunRow;

export interface CreateAgentInput {
  name: string;
  emoji: string;
  description: string;
  instructions: string;
  permissions: string[];
  cardLimitUsd: number;
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
  stats(): Promise<Stats>;
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

/* ------------------------------------------------------------------ */
/* In-memory store (local development without a database)             */
/* ------------------------------------------------------------------ */

function createMemoryStore(): AgentsStore {
  const agentRows: Agent[] = [];
  const runRows: Run[] = [];

  return {
    kind: "memory",
    async createAgent(input) {
      const row: Agent = {
        ...toAgentRow(input),
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
      const row: Run = { ...toRunRow(input), userId: input.userId ?? null, userName: input.userName ?? null, costUsd: input.costUsd == null ? null : input.costUsd.toFixed(6), inputTokens: input.inputTokens ?? null, outputTokens: input.outputTokens ?? null, createdAt: new Date() };
      runRows.unshift(row);
      const agent = agentRows.find((a) => a.id === input.agentId);
      if (agent) agent.runsCount += 1;
      return row;
    },
    async listRuns(agentId, limit = 20) {
      return runRows.filter((r) => r.agentId === agentId).slice(0, limit);
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
