import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { findReadableDocument, findUserDocument } from "@/lib/documents";
import { deleteAgent, deleteKnowledgeDoc, ElevenLabsApiError } from "@/lib/elevenlabs";
import { handleRouteError, jsonError } from "@/lib/http";

// GET -> { document }
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  try {
    const document = await findReadableDocument(await getUserId(), (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);
    return Response.json({ document });
  } catch (err) {
    return handleRouteError(err, "Could not load the document");
  }
}

// DELETE -> 204. Owner only (catalog books can't be deleted). Removes the ElevenLabs agent and knowledge-base file too.
export async function DELETE(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  try {
    const document = await findUserDocument(await getUserId(), (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    // Already gone on ElevenLabs (404) is fine; anything else aborts so we don't orphan paid resources.
    const ignoreNotFound = (err: unknown) => {
      if (!(err instanceof ElevenLabsApiError && err.status === 404)) throw err;
    };
    if (document.elevenlabsAgentId) await deleteAgent(document.elevenlabsAgentId).catch(ignoreNotFound);
    if (document.elevenlabsKnowledgeBaseId) {
      await deleteKnowledgeDoc(document.elevenlabsKnowledgeBaseId).catch(ignoreNotFound);
    }

    await getDb().delete(schema.documents).where(eq(schema.documents.id, document.id));
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err, "Could not delete the document");
  }
}
