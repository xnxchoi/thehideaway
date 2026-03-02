import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check for Better Auth session cookie — no DB or HTTP sub-request needed.
	// Better Auth sets this cookie before redirecting to the callbackURL, so it
	// is always present by the time this middleware runs on the protected route.
	// The __Secure- prefix variant is used in production HTTPS contexts.
	const sessionCookie =
		request.cookies.get("better-auth.session_token") ||
		request.cookies.get("__Secure-better-auth.session_token");

	if (!sessionCookie) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/me/:path*",
		"/prive/:path*",
		"/account/:path*",
		"/admin-ba/:path*",
	],
};
