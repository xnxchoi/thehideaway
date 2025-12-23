import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const url = request.nextUrl.searchParams.get("url");

	if (!url) {
		// Return an error if no URL was provided
		return new NextResponse("Missing image URL", {status: 400});
	}
	try {

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Accept: "image/*",
				"User-Agent": "Mozilla/5.0 (compatible; MyApp/1.0; +https://hideawayseoul.com)"
			}, cache: "force-cache",
			next: {
				revalidate: 24 * 7 * 3600
			}
		});
		if (!response.ok) throw new Error("Image fetch failed");

		const contentType = response.headers.get("content-type") || "application/octet-stream";
		const buffer = await response.arrayBuffer();
		return new NextResponse(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400"  // Cache for 24 hours (86400 seconds)
			}
		});
	} catch (error) {
		// Log the error server-side and return a simple error to the client
		console.error("Image proxy error:", error);
		return new NextResponse("Failed to fetch image", {status: 500});
	}
}