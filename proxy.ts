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
];
const AUTH_ROUTES = ["/login"];

function isOnboardingComplete(request: NextRequest): boolean {
  const raw = request.cookies.get("personalos_prefs")?.value;
  if (!raw) return false;
  try {
    return Boolean(JSON.parse(raw).onboardingComplete);
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!isProtected && !isAuthRoute && pathname !== "/onboarding") {
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

  if (isProtected && session?.user && !isOnboardingComplete(request)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (pathname === "/onboarding" && !session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
