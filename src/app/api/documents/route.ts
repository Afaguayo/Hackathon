import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { createDocumentAgent, deleteAgent, deleteKnowledgeDoc, uploadKnowledgeFile } from "@/lib/elevenlabs";
import { handleRouteError, jsonError } from "@/lib/http";

const { documents } = schema;

// Vercel functions reject request bodies over 4.5 MB, so uploads through this route stay under that.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".epub", ".docx", ".html"];

// GET -> the current user's documents, newest first.
export async function GET() {
  try {
    const userId = await getUserId();
    const rows = await getDb()
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
    return Response.json({ documents: rows });
  } catch (err) {
    return handleRouteError(err, "Could not list documents");
  }
}

// POST multipart/form-data { file, title?, author? } -> 201 { document }
// Uploads the file to the ElevenLabs knowledge base and creates the document's own agent.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Send multipart/form-data with a `file` field", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("`file` is required", 400);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("File is too large (max 4 MB)", 413);
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return jsonError(`Unsupported file type. Use one of: ${ALLOWED_EXTENSIONS.join(", ")}`, 415);
  }

  const title = String(form.get("title") ?? "").trim() || file.name.slice(0, -extension.length);
  const author = String(form.get("author") ?? "").trim() || null;

  let documentId: string | undefined;
  let knowledgeBaseId: string | undefined;
  let agentId: string | undefined;
  try {
    const userId = await getUserId();
    const db = getDb();
    [{ id: documentId }] = await db
      .insert(documents)
      .values({ userId, title, author, fileName: file.name, mimeType: file.type || null, sizeBytes: file.size })
      .returning({ id: documents.id });

    knowledgeBaseId = await uploadKnowledgeFile(file, title);
    agentId = await createDocumentAgent(knowledgeBaseId, title);

    const [document] = await db
      .update(documents)
      .set({ status: "ready", elevenlabsKnowledgeBaseId: knowledgeBaseId, elevenlabsAgentId: agentId, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
      .returning();
    return Response.json({ document }, { status: 201 });
  } catch (err) {
    // Don't leave half-created ElevenLabs resources behind; keep the row as "failed" with the reason.
    await Promise.allSettled([agentId && deleteAgent(agentId), knowledgeBaseId && deleteKnowledgeDoc(knowledgeBaseId)]);
    if (documentId) {
      await getDb()
        .update(documents)
        .set({ status: "failed", error: err instanceof Error ? err.message.slice(0, 500) : String(err), updatedAt: new Date() })
        .where(eq(documents.id, documentId))
        .catch(() => {});
    }
    return handleRouteError(err, "Could not upload the document");
  }
}
