/**
 * Connect this adapter to the server-side session mechanism used by your app.
 *
 * The reference app intentionally returns null so a copied deployment cannot
 * create billable voice sessions for anonymous visitors by accident.
 */
export type AuthenticatedUser = { id: string };

export async function getAuthenticatedUser(_request: Request): Promise<AuthenticatedUser | null> {
  return null;
}
