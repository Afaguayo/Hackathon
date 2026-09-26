import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { handleRouteError, isUuid, jsonError } from "@/lib/http";

const { notes } = schema;

// DELETE -> 204
export async function DELETE(_request: Request, ctx: RouteContext<"/api/documents/[id]/notes/[noteId]">) {
  const { id, noteId } = await ctx.params;
  if (!isUuid(id) || !isUuid(noteId)) return jsonError("Note not found", 404);
  try {
    const deleted = await getDb()
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.documentId, id), eq(notes.userId, await getUserId())))
      .returning({ id: notes.id });
    if (!deleted.length) return jsonError("Note not found", 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err, "Could not delete the note");
  }
}
