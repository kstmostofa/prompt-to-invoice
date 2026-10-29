import { auth } from "@/auth";
import { AccessUser, canManageWorkspace, homeFor, isPlatformAdmin } from "@/lib/utils";
import { NextResponse } from "next/server";

// Signed-out pages. Matched as prefixes.
const guestPrefixes = ["/login", "/register", "/forgot-password", "/reset-password"];

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as AccessUser | undefined;

  // Email links and the client's invoice view work for anyone, signed in or not.
  if (
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/session-expired") ||
    pathname.startsWith("/i/")
  ) {
    return NextResponse.next();
  }

  if (guestPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return isLoggedIn ? NextResponse.redirect(new URL(homeFor(user), req.url)) : NextResponse.next();
  }

  if (!isLoggedIn) {
    if (pathname === "/") return NextResponse.redirect(new URL("/login", req.url));
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(homeFor(user), req.url));
  }

  // The admin portal is for platform staff; the workspace portal is for
  // workspace members. Staff accounts have no workspace of their own.
  if (pathname.startsWith("/admin")) {
    return isPlatformAdmin(user) ? NextResponse.next() : NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isPlatformAdmin(user) && !pathname.startsWith("/account")) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (pathname.startsWith("/settings") && !canManageWorkspace(user)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
