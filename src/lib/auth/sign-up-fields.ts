export const SIGN_UP_FIELDS = ["name", "location", "bio", "link"] as const;

export type SignUpField = (typeof SIGN_UP_FIELDS)[number];
