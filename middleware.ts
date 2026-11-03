import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account") && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/login"],
};
