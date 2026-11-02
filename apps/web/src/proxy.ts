import { NextResponse, type NextRequest } from "next/server";
import { ONBOARDED_COOKIE } from "@/lib/constants";

export function proxy(request: NextRequest) {
  if (request.cookies.has(ONBOARDED_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/welcome", request.url));
}

export const config = { matcher: "/" };
