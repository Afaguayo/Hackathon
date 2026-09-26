import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { findUserDocument } from "@/lib/documents";
import { handleRouteError, jsonError } from "@/lib/http";

const { conversations, messages } = schema;

// GET -> { conversations: [{ ...conversation, messages: [...] }] }, newest first.
// Conversations are saved by the ElevenLabs post-call webhook.
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]/conversations">) {
  try {
    const userId = await getUserId();
    const document = await findUserDocument(userId, (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    const db = getDb();
    const convos = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.documentId, document.id)))
      .orderBy(desc(conversations.startedAt));
    const msgs = convos.length
      ? await db
          .select()
          .from(messages)
          .where(inArray(messages.conversationId, convos.map((c) => c.id)))
          .orderBy(asc(messages.secondsFromStart))
      : [];

    return Response.json({
      conversations: convos.map((c) => ({ ...c, messages: msgs.filter((m) => m.conversationId === c.id) })),
    });
  } catch (err) {
    return handleRouteError(err, "Could not load conversations");
  }
}
