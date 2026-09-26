import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUserId } from "@/lib/auth";
import { findUserDocument } from "@/lib/documents";
import { handleRouteError, jsonError } from "@/lib/http";

const { readingProgress } = schema;

// GET -> { progress } (position 0 / percent 0 when the user hasn't started).
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]/progress">) {
  try {
    const userId = await getUserId();
    const document = await findUserDocument(userId, (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    const [progress] = await getDb()
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.documentId, document.id)));
    return Response.json({
      progress: progress ?? { userId, documentId: document.id, position: 0, percent: 0, lastReadAt: null },
    });
  } catch (err) {
    return handleRouteError(err, "Could not load progress");
  }
}

// PUT { position, percent } -> { progress }. `position` is whatever unit the UI uses (page, paragraph...).
export async function PUT(request: Request, ctx: RouteContext<"/api/documents/[id]/progress">) {
  const body = await request.json().catch(() => null);
  const position = body?.position;
  const percent = body?.percent;
  if (!Number.isInteger(position) || position < 0) return jsonError("`position` must be a non-negative integer", 400);
  if (typeof percent !== "number" || percent < 0 || percent > 100) return jsonError("`percent` must be 0-100", 400);

  try {
    const userId = await getUserId();
    const document = await findUserDocument(userId, (await ctx.params).id);
    if (!document) return jsonError("Document not found", 404);

    const values = { position, percent, lastReadAt: new Date() };
    const [progress] = await getDb()
      .insert(readingProgress)
      .values({ userId, documentId: document.id, ...values })
      .onConflictDoUpdate({ target: [readingProgress.userId, readingProgress.documentId], set: values })
      .returning();
    return Response.json({ progress });
  } catch (err) {
    return handleRouteError(err, "Could not save progress");
  }
}
