import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/projects",
  "/calendar",
  "/habits",
  "/capture",
  "/coach",
  "/reports",
  "/settings",
  "/onboarding",
];
const AUTH_ROUTES = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const session = await auth();

  if (isProtected && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
