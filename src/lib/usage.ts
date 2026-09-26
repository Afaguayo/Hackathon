import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { UsageKind } from "@/db/schema";

const { usageEvents } = schema;
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Rolling 24h limits. The global caps protect the shared ElevenLabs quota (131k chars/month on
// the Creator plan) no matter how many users sign up. Override any of them with env vars.
function limit(envName: string, fallback: number) {
  const value = Number(process.env[envName]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function usageLimits(): Record<UsageKind, { perUser: number; global: number }> {
  return {
    tts_chars: { perUser: limit("LIMIT_TTS_CHARS_PER_USER", 5_000), global: limit("LIMIT_TTS_CHARS_GLOBAL", 20_000) },
    upload: { perUser: limit("LIMIT_UPLOADS_PER_USER", 10), global: limit("LIMIT_UPLOADS_GLOBAL", 100) },
    agent_session: { perUser: limit("LIMIT_SESSIONS_PER_USER", 30), global: limit("LIMIT_SESSIONS_GLOBAL", 300) },
    ai_request: { perUser: limit("LIMIT_AI_PER_USER", 100), global: limit("LIMIT_AI_GLOBAL", 1000) },
  };
}

const LABELS: Record<UsageKind, string> = {
  tts_chars: "read-aloud characters",
  upload: "uploads",
  agent_session: "voice sessions",
  ai_request: "Reed answers",
};

export class UsageLimitError extends Error {
  constructor(
    readonly kind: UsageKind,
    readonly scope: "user" | "global",
  ) {
    super(
      scope === "user"
        ? `Daily limit reached for ${LABELS[kind]}. Try again later.`
        : `The app's daily budget for ${LABELS[kind]} is used up. Try again later.`,
    );
  }
}

async function usedSince(kind: UsageKind, since: Date, userId?: string) {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${usageEvents.amount}), 0)::int` })
    .from(usageEvents)
    .where(and(eq(usageEvents.kind, kind), gt(usageEvents.createdAt, since), userId ? eq(usageEvents.userId, userId) : undefined));
  return row.total;
}

/**
 * Throws UsageLimitError if `amount` more of `kind` would exceed the user's or the global 24h limit;
 * otherwise records it. Call right before the paid ElevenLabs request. Concurrent requests can
 * overshoot slightly (check and insert aren't atomic), which is fine for cost protection.
 */
export async function consumeUsage(userId: string, kind: UsageKind, amount = 1) {
  const since = new Date(Date.now() - WINDOW_MS);
  const limits = usageLimits()[kind];
  const [user, global] = await Promise.all([usedSince(kind, since, userId), usedSince(kind, since)]);
  if (user + amount > limits.perUser) throw new UsageLimitError(kind, "user");
  if (global + amount > limits.global) throw new UsageLimitError(kind, "global");
  await getDb().insert(usageEvents).values({ userId, kind, amount });
}

/** Usage in the last 24h vs. limits, for GET /api/usage. */
export async function usageSummary(userId: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const limits = usageLimits();
  const kinds = Object.keys(limits) as UsageKind[];
  const used = await Promise.all(kinds.map((kind) => usedSince(kind, since, userId)));
  return Object.fromEntries(kinds.map((kind, i) => [kind, { used: used[i], limit: limits[kind].perUser }]));
}
