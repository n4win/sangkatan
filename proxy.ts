import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/signin");

  if (!isAdminRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const session = await auth();
  const isLoggedIn = !!session?.user;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/home", request.nextUrl));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(
          `/signin?callbackUrl=${encodeURIComponent(pathname)}`,
          request.nextUrl,
        ),
      );
    }

    const role = (session.user as { role?: string })?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/signin"],
};
