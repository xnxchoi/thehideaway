/** API-level response shapes (distinct from the HandleError class in index.ts) */
export type HandleApiError =
  | { valid: false; handle: string }
  | { error: string };

export type HandleSuccess = {
  valid: true;
  handle: string;
};

export type HandleResponse = HandleSuccess | HandleApiError;
