import { getUserId } from "@/lib/auth";
import { findUserDocument } from "@/lib/documents";
import { getAgentSignedUrl } from "@/lib/elevenlabs";
import { handleRouteError, jsonError } from "@/lib/http";

// GET -> { signedUrl } for a voice session with this document's agent (it can search the whole document).
// The URL is short-lived and single-use, so it must never be cached.
export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]/signed-url">) {
  try {
    const document = await findUserDocument(await getUserId(), (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);
    if (document.status !== "ready" || !document.elevenlabsAgentId) {
      return jsonError(`Document is not ready (status: ${document.status})`, 409);
    }
    return Response.json(
      { signedUrl: await getAgentSignedUrl(document.elevenlabsAgentId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleRouteError(err, "Could not start a companion session");
  }
}
