import { timingSafeEqual } from "node:crypto";
import { getDb, schema } from "@/db";
import { findDocumentByAgentId } from "@/lib/documents";
import { jsonError } from "@/lib/http";

// Server tool the ElevenLabs agent calls mid-conversation ("remember this for me").
// ElevenLabs sends the header `x-agent-tool-secret: <ELEVENLABS_TOOL_SECRET>` and a body
// { agent_id: "{{system__agent_id}}", text, quote? }; the agent id tells us the document and its owner.
function authorized(request: Request): boolean {
  const secret = process.env.ELEVENLABS_TOOL_SECRET;
  const received = request.headers.get("x-agent-tool-secret");
  if (!secret || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!process.env.ELEVENLABS_TOOL_SECRET) return jsonError("ELEVENLABS_TOOL_SECRET is not set", 500);
  if (!authorized(request)) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const agentId = typeof body?.agent_id === "string" ? body.agent_id : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 5000) : "";
  const quote = typeof body?.quote === "string" && body.quote.trim() ? body.quote.trim().slice(0, 5000) : null;
  if (!agentId || !text) return jsonError("`agent_id` and `text` are required", 400);

  try {
    const document = await findDocumentByAgentId(agentId);
    if (!document) return jsonError("This agent is not linked to a document", 404);

    await getDb()
      .insert(schema.notes)
      .values({ userId: document.userId, documentId: document.id, type: "note", text, quote });
    // The agent reads this result, so keep it short and speakable.
    return Response.json({ result: "Saved the note." });
  } catch (err) {
    console.error(err);
    return jsonError("Could not save the note", 500);
  }
}
