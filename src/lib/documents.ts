import { and, eq, getTableColumns, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isUuid } from "./http";

// Every document column except the (possibly large) extracted text; fetch that via /content.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { content: _content, ...documentSummaryColumns } = getTableColumns(schema.documents);
export { documentSummaryColumns };

/** The user's own document with this id (without its text), or undefined (also for malformed ids, so routes return 404). For changes like delete. */
export async function findUserDocument(userId: string, id: string) {
  if (!isUuid(id)) return undefined;
  const [document] = await getDb()
    .select(documentSummaryColumns)
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, userId)));
  return document;
}

/** A document the user may read: their own, or a catalog (public) book. Use for every read-only route. */
export async function findReadableDocument(userId: string, id: string) {
  if (!isUuid(id)) return undefined;
  const [document] = await getDb()
    .select(documentSummaryColumns)
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), or(eq(schema.documents.userId, userId), eq(schema.documents.isPublic, true))));
  return document;
}

/**
 * The document a per-document ElevenLabs agent belongs to. ElevenLabs callbacks (webhooks, tools)
 * only tell us the agent id, and each agent serves exactly one document, so this also gives the owner.
 */
export async function findDocumentByAgentId(agentId: string) {
  const [document] = await getDb()
    .select(documentSummaryColumns)
    .from(schema.documents)
    .where(eq(schema.documents.elevenlabsAgentId, agentId));
  return document;
}
