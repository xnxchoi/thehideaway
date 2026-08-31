import type {FieldHook, FieldHookArgs} from "payload"

export const isBlankSlugKey = (value: unknown): boolean => {
	if (typeof value !== "string") return true;
	const trimmed = value.trim();
	return trimmed === "" || trimmed === "undefined" || trimmed === "null";
};

export const composeHashedSlug = (
	slugKey: unknown,
	hashId: unknown
): string => {
	const key = isBlankSlugKey(slugKey) ? "" : (slugKey as string).trim();
	const hash = typeof hashId === "string" ? hashId.trim() : "";
	return [key, hash].filter(Boolean).join("-");
};

export const formatSlug = (input: string): string => {
	return (
		input
			// Normalize the string to Unicode NFKD (splits diacritics from Latin letters)
			.normalize("NFKD")

			// Remove diacritics from Latin letters (e.g., é -> e)
			.replace(/[\u0300-\u036f]/g, "")

			// Replace any character that is not:
			// - a Korean syllable (가-힣)
			// - a CJK character (for future-proofing, optional)
			// - a Latin letter (a-z, A-Z)
			// - a number (0-9)
			// - or a space/hyphen
			// with a space
			.replace(/[^\p{Script=Hangul}\p{Script=Latin}\p{N}\- ]+/gu, " ")

			// Convert multiple spaces or hyphens to a single hyphen
			.replace(/[-\s]+/g, "-")

			// Lowercase only Latin characters (Korean has no case)
			.replace(/[A-Z]/g, (ch) => ch.toLowerCase())

			// Trim leading/trailing hyphens
			.replace(/^-+|-+$/g, "")
	)
}
export const formatSlugHook =
	(fallback: string): FieldHook =>
		({
			data,
			value,
		}: FieldHookArgs<any, string, any>): string => {
			const title = data?.[fallback];
			if (!isBlankSlugKey(value)) {
				return formatSlug(value as string);
			}
			if (typeof title === "string" && title.trim()) {
				return formatSlug(title);
			}
			return "";
		};