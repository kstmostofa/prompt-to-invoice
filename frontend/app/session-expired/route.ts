import { signOut } from "@/auth";

/**
 * Where a page goes when the API no longer accepts the session's token
 * (signed out elsewhere, password changed, account deactivated): clear the
 * session and start again at the login page.
 */
export async function GET() {
  await signOut({ redirectTo: "/login?expired=1" });
}
