import { NextRequest, NextResponse } from "next/server";

import {
  isLostGatePassword,
  LOST_GATE_COOKIE_MAX_AGE_SECONDS,
  LOST_GATE_COOKIE_NAME,
  LOST_GATE_COOKIE_VALUE
} from "@/lib/lostinseoul/gate";

function firstFormString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function forwardedHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host
  );
}

function isLostHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase();

  return hostname === "lostinseoul.com" || hostname === "www.lostinseoul.com";
}

function cleanLostReturnTo(returnTo: string): string {
  if (returnTo === "/lostinseoul") return "/";
  if (returnTo.startsWith("/lostinseoul/")) {
    return returnTo.slice("/lostinseoul".length) || "/";
  }
  return returnTo;
}

function safeReturnTo(value: string, publicLostHost: boolean): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/")) return "/";

  return publicLostHost ? cleanLostReturnTo(value) : value;
}

function gatePath(publicLostHost: boolean): string {
  return publicLostHost ? "/gate" : "/lostinseoul/gate";
}

function publicOrigin(request: NextRequest): string {
  const host = forwardedHost(request);
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  const protocol = forwardedProto.replace(/:$/, "") || "https";

  return `${protocol}://${host}`;
}

function redirectUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, publicOrigin(request));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const publicLostHost = isLostHost(forwardedHost(request));
  const returnTo = safeReturnTo(
    firstFormString(formData.get("returnTo")),
    publicLostHost
  );
  const password = firstFormString(formData.get("password"));

  if (!(await isLostGatePassword(password))) {
    const url = redirectUrl(request, gatePath(publicLostHost));
    url.searchParams.set("returnTo", returnTo);
    url.searchParams.set("error", "invalid");

    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(redirectUrl(request, returnTo), {
    status: 303
  });
  response.cookies.set(LOST_GATE_COOKIE_NAME, LOST_GATE_COOKIE_VALUE, {
    httpOnly: true,
    maxAge: LOST_GATE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
