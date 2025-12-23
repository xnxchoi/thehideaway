// features/rp-image/utils/errors.ts

// A generic, polite message for "Unknown" errors
export const GENERIC_RP_ERROR = "We couldn't load this media right now. Please try again later.";

export class RPFetchError extends Error {
	public statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = "RPFetchError";
		this.statusCode = statusCode;

		// Maintain prototype chain for instanceof checks
		Object.setPrototypeOf(this, RPFetchError.prototype);
	}
}

// Utility to determine what text to show in the UI
export function getSafeErrorMessage(error: unknown): string {
	// Case A: Predicted, safe error (e.g., "Image not found", "File too large")
	if (error instanceof RPFetchError) {
		// Log internally if needed
		console.warn(`[RP Handled Error]: ${error.message}`);
		return error.message;
	}

	// Case B: Unpredicted code error (e.g., Network crash, SyntaxError)
	if (error instanceof Error) {
		// Log the dirty details internally
		console.error(`[RP Critical Error]:`, error.message, error.stack);
	} else {
		console.error(`[RP Unknown Error]:`, error);
	}

	// Always return the sanitized message to the VIP user
	return GENERIC_RP_ERROR;
}