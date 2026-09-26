import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { findDocumentByAgentId } from "@/lib/documents";
import { jsonError } from "@/lib/http";
import { verifyElevenLabsSignature } from "@/lib/webhook-signature";

const { conversations, messages } = schema;

type PostCallTranscription = {
  type: string;
  data: {
    agent_id: string;
    conversation_id: string;
    transcript?: { role: "user" | "agent"; message: string | null; time_in_call_secs?: number }[];
    metadata?: { start_time_unix_secs?: number; call_duration_secs?: number };
    analysis?: { transcript_summary?: string };
  };
};

// ElevenLabs post-call webhook: saves each finished conversation with a document's agent
// (transcript + summary) under that document's owner.
// Configure in ElevenLabs → Agents → Settings → Post-call webhook, URL <deploy>/api/webhooks/elevenlabs,
// and put its secret in ELEVENLABS_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return jsonError("ELEVENLABS_WEBHOOK_SECRET is not set", 500);

  const rawBody = await request.text();
  if (!verifyElevenLabsSignature(rawBody, request.headers.get("elevenlabs-signature"), secret)) {
    return jsonError("Invalid signature", 401);
  }

  let event: PostCallTranscription;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonError("Body is not JSON", 400);
  }
  // Other event types (e.g. audio) are acknowledged so ElevenLabs doesn't retry them.
  if (event.type !== "post_call_transcription") return Response.json({ ignored: event.type });

  const { agent_id, conversation_id, transcript = [], metadata = {}, analysis = {} } = event.data ?? {};
  if (!agent_id || !conversation_id) return jsonError("Missing agent_id or conversation_id", 400);

  try {
    // Only per-document agents map to a user; the general companion's sessions aren't stored.
    const document = await findDocumentByAgentId(agent_id);
    if (!document) return Response.json({ ignored: "agent is not linked to a document" });

    const db = getDb();
    // ElevenLabs retries failed deliveries; a conversation is stored once.
    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.elevenlabsConversationId, conversation_id));
    if (existing) return Response.json({ conversationId: existing.id, duplicate: true });

    const conversationId = crypto.randomUUID();
    const rows = transcript
      .filter((turn) => turn.message?.trim())
      .map((turn) => ({
        conversationId,
        role: turn.role,
        text: turn.message!.trim(),
        secondsFromStart: turn.time_in_call_secs ?? null,
      }));

    const insertConversation = db.insert(conversations).values({
      id: conversationId,
      userId: document.userId,
      documentId: document.id,
      elevenlabsConversationId: conversation_id,
      summary: analysis.transcript_summary ?? null,
      durationSeconds: metadata.call_duration_secs ?? null,
      startedAt: metadata.start_time_unix_secs ? new Date(metadata.start_time_unix_secs * 1000) : new Date(),
    });
    // batch runs as one transaction, so we never keep a conversation without its messages.
    if (rows.length) await db.batch([insertConversation, db.insert(messages).values(rows)]);
    else await insertConversation;

    return Response.json({ conversationId, messages: rows.length });
  } catch (err) {
    console.error(err);
    // 5xx makes ElevenLabs retry later.
    return jsonError("Could not store the conversation", 500);
  }
}
