// TEMPORARY: every request acts as one demo user until Clerk is added.
// Replace the body with Clerk's `const { userId } = await auth()` and return 401 when it's null;
// every route already scopes its queries by this id, so nothing else has to change.
export const DEMO_USER_ID = "demo-user";

export async function getUserId(): Promise<string> {
  return DEMO_USER_ID;
}
