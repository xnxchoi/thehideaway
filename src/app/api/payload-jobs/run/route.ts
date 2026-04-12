import {timingSafeEqual} from "crypto";
import {NextRequest, NextResponse} from "next/server";
import {getPayload} from "payload";
import config from "@payload-config";

// Authentication helper
function isAuthenticated(request: NextRequest): boolean {
	const cronSecret = process.env.CRON_SECRET;

	// SECURITY: if CRON_SECRET is not set, reject all requests.
	// The old code fell through to `return true` when unset, allowing
	// unauthenticated job execution.
	if (!cronSecret) {
		return false;
	}

	const authHeader = request.headers.get("authorization") ?? "";
	const expected = `Bearer ${cronSecret}`;

	// SECURITY: use timing-safe comparison to prevent token length leakage.
	// Pad both to the same length so timingSafeEqual doesn't throw on mismatched sizes.
	const a = Buffer.from(authHeader.padEnd(expected.length));
	const b = Buffer.from(expected.padEnd(authHeader.length));
	return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
	const startTime = Date.now();

	const payload = await getPayload({config});

	try {
		// Check authentication
		if (!isAuthenticated(request)) {
			return NextResponse.json(
				{success: false, error: "Unauthorized"},
				{status: 401},
			);
		}

		payload.logger.info("=== JOB EXECUTION ENDPOINT CALLED ===");

		// Run jobs with a limit
		const result = await payload.jobs.run({
			limit: 10,
			queue: "default",
		});

		const executionTime = Date.now() - startTime;

		payload.logger.info(`=== JOB EXECUTION COMPLETED ===`);
		payload.logger.info(`Execution time: ${executionTime}ms`);
		payload.logger.info(`Result: ${JSON.stringify(result)}`);

		return NextResponse.json({
			success: true,
			result,
			executionTimeMs: executionTime,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		const executionTime = Date.now() - startTime;
		payload.logger.error({ msg: "Error running jobs", err: error });

		return NextResponse.json(
			{
				success: false,
				error: "Job execution failed",
				executionTimeMs: executionTime,
				timestamp: new Date().toISOString(),
			},
			{status: 500},
		);
	}
}

export async function GET(request: NextRequest) {
	// Allow GET requests for Vercel cron
	return POST(request);
}
