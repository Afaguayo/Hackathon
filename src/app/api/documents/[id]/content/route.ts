import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { handleRouteError, isUuid, jsonError } from "@/lib/http";

const { documents } = schema;

// GET -> { content: { chapters: [{ number, title, paragraphs: string[] }] } } for the reader.
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]/content">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError("Document not found", 404);
  try {
    const [row] = await getDb()
      .select({ content: documents.content })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, await getUserId())));
    if (!row) return jsonError("Document not found", 404);
    if (!row.content) return jsonError("This document has no readable text (uploaded before text extraction)", 409);
    return Response.json({ content: row.content });
  } catch (err) {
    return handleRouteError(err, "Could not load the document text");
  }
}
