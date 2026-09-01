import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export function middleware(request: NextRequest) {
  // Protect /score route
  if (request.nextUrl.pathname.startsWith("/score")) {
    if (!isAuthenticatedFromRequest(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/score/:path*"],
};
