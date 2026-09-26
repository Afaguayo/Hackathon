import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { findUserDocument } from "@/lib/documents";
import { handleRouteError, jsonError } from "@/lib/http";

const { notes } = schema;
const NOTE_TYPES = ["highlight", "note", "definition"] as const;
type NoteType = (typeof NOTE_TYPES)[number];

// GET -> { notes } for this document, newest first.
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]/notes">) {
  try {
    const userId = await getUserId();
    const document = await findUserDocument(userId, (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    const rows = await getDb()
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.documentId, document.id)))
      .orderBy(desc(notes.createdAt));
    return Response.json({ notes: rows });
  } catch (err) {
    return handleRouteError(err, "Could not load notes");
  }
}

// POST { text, quote?, type? } -> 201 { note }. type: highlight | note | definition (default note).
export async function POST(request: Request, ctx: RouteContext<"/api/documents/[id]/notes">) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const quote = typeof body?.quote === "string" && body.quote.trim() ? body.quote.trim() : null;
  const type: NoteType = body?.type ?? "note";
  if (!text) return jsonError("`text` is required", 400);
  if (text.length > 5000 || (quote && quote.length > 5000)) return jsonError("Note is too long (max 5000 chars)", 413);
  if (!NOTE_TYPES.includes(type)) return jsonError(`\`type\` must be one of: ${NOTE_TYPES.join(", ")}`, 400);

  try {
    const userId = await getUserId();
    const document = await findUserDocument(userId, (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    const [note] = await getDb().insert(notes).values({ userId, documentId: document.id, type, text, quote }).returning();
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "Could not save the note");
  }
}
