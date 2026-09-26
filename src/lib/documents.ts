import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isUuid } from "./http";

/** The user's document with this id, or undefined (also for malformed ids, so routes return 404). */
export async function findUserDocument(userId: string, id: string) {
  if (!isUuid(id)) return undefined;
  const [document] = await getDb()
    .select()
    .from(schema.documents)
    .where(and(eq(schema.documents.id, id), eq(schema.documents.userId, userId)));
  return document;
}
