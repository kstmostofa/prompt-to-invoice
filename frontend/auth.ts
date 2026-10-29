import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LOGIN_URL } from "@/lib/api-urls";
import { clientIpHeaders } from "@/lib/client-ip";
import type { User as ApiUser } from "@/types/api";

/**
 * The password was right but the account is switched off. Told apart from a
 * wrong password so the person knows to contact support, not to reset it;
 * the API only says so once the password has been checked.
 */
class AccountDeactivated extends CredentialsSignin {
  code = "deactivated";
}

/** The API's sign-in rate limit was hit. */
class TooManyAttempts extends CredentialsSignin {
  code = "throttled";
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        let res: Response;
        let data: {
          success?: boolean;
          token?: string;
          errors?: Record<string, string[]>;
          user?: ApiUser;
        };
        try {
          res = await fetch(LOGIN_URL, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(await clientIpHeaders()),
            },
          });

          if (res.status === 429) throw new TooManyAttempts();
          data = await res.json();
        } catch (error) {
          if (error instanceof TooManyAttempts) throw error;
          // Do not log auth errors with payloads; a null return surfaces as
          // CredentialsSignin to the caller.
          return null;
        }

        if (res.ok && data.success && data.user && data.token) {
          const current = data.user.workspaces?.find(
            (workspace) => workspace.id === data.user?.current_workspace_id
          );
          return {
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            isAdmin: data.user.is_admin,
            role: current?.role ?? "",
            workspaceId: current?.id ?? null,
            workspaceName: current?.name ?? null,
            accessToken: data.token,
          };
        }
        if (data.errors?.email?.some((message) => message.includes("deactivated"))) {
          throw new AccountDeactivated();
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Profile edits and workspace switches refresh the cached details.
      if (trigger === "update" && token.user && session?.user) {
        token.user = { ...token.user, ...session.user };
      }
      if (user) {
        token.accessToken = user.accessToken;
        token.user = {
          id: user.id!,
          name: user.name!,
          email: user.email!,
          isAdmin: user.isAdmin,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspaceName,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        if (token.user) {
          session.user = {
            ...session.user,
            ...token.user,
          };
        }
      }
      return session;
    },
    // Only allow same-origin path redirects (open-redirect guard).
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
