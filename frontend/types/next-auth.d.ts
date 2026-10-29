import { DefaultSession } from "next-auth";
import "next-auth/jwt";

/** What the session keeps about the signed-in person. */
interface SessionUser {
  id: string;
  name: string;
  email: string;
  /** Platform staff: the admin portal, never a workspace's data. */
  isAdmin: boolean;
  /** Sending invoices by email needs a verified address. */
  isVerified: boolean;
  /** Their role in their current workspace: owner, admin or member. */
  role: string;
  workspaceId: number | null;
  workspaceName: string | null;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: SessionUser & DefaultSession["user"];
  }

  interface User extends SessionUser {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    error?: string;
    user?: SessionUser;
  }
}
