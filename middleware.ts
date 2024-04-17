import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionUser } from "./lib/db/entities/User";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const authenticated = request.headers.get("x-user-authenticated") === "true";
  const status = request.headers.get("x-user-data");

  const url = request.nextUrl.clone();

  //Redirect to login page if user is not authenticated with return URL
  if (!authenticated) {
    const returnUrl = encodeURIComponent(url.pathname + url.search);
    //Redirect to login page if user is not authenticated {
    url.pathname = "/login";
    url.search = `?returnUrl=${returnUrl}`;
    return NextResponse.redirect(url);
  }

  //Redirect to verify page if user is not verified
  if (status === "unverified" && !url.pathname.startsWith("/complete-profile")) {
    //Redirect to verify page if user is not verified
    url.pathname = "/verify";
    return NextResponse.redirect(url);
  }

  //Redirect to complete profile page if user profile is incomplete
  if (status === "incomplete" && !url.pathname.startsWith("/complete-profile")) {
    //Redirect to complete profile page if user profile is incomplete
    url.pathname = "/complete-profile";
    return NextResponse.redirect(url);
  }

  //Redirect guest users if they try to access profile page
  if (status === "guest" && url.pathname.startsWith("/profile")) {
    //Redirect guest users if they try to access profile page
    url.pathname = "/play";
    return NextResponse.redirect(url);
  }

  //Redirect to play page if user is authenticated
  if (url.pathname === "/") {
    url.pathname = "/play";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup|privacy|terms-and-conditions|help|auth).*)"],
};
