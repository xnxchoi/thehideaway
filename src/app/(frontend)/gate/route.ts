import { NextResponse, type NextRequest } from "next/server";

function redirectHome(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

export function GET(request: NextRequest) {
  return redirectHome(request);
}

export function HEAD(request: NextRequest) {
  return redirectHome(request);
}
