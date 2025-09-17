import type {FieldHook, FieldHookArgs} from "payload"


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
			operation,
			siblingData,
			originalDoc,
			value,
			collection,
		}: FieldHookArgs<any, string, any>): string | void => {


			if (typeof value === "string") {
				return formatSlug(value)
			}
			if (operation === 'create' || !data?.slug) {
				const fallbackData = data?.[fallback] || data?.[fallback]

				if (fallbackData && typeof fallbackData === 'string') {
					return formatSlug(fallbackData)
				}
			}

			return value
		}