import { auth } from "@clerk/nextjs/server";

export class UnauthorizedError extends Error {}

/**
 * The signed-in Clerk user's id. Accepts the browser session cookie or an
 * `Authorization: Bearer <session token>` header. Throws UnauthorizedError (→ 401) when signed out.
 */
export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError("Sign in required");
  return userId;
}
