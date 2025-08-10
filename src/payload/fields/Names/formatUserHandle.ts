import type {FieldHook} from "payload";

export function formatUserHandle(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots
		.replace(/^\.*/g, "") // 3. remove leading dots
		.replace(/\.*$/g, "") // 4. remove trailing dots
		.replace(/_\._/g, ".").replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/\._/g, "_") // 6. remove any lingering dot-underscore patterns
		.replace(/_\./g, "_") // 7. remove underscore-dot patterns
		.slice(0, 30); // 8. max length
}

export const HANDLE_TEST_REGEX =
	/^(?=.{1,30}$)(?=[a-z0-9._]+$)(?=.*[a-z0-9])(?:[a-z0-9]+(?:\.[a-z0-9]+)*|[a-z0-9_]+)+$/;

export const formatUserHandleHook =
	(fb?: string): FieldHook =>
		({data, operation, siblingData, originalDoc, value}) => {
			if (typeof value === "string") {
				return formatUserHandle(value);
			}

			if (operation === "create" || !data?.slug) {
				const fallbackData =
					(siblingData?.name || originalDoc?.name || originalDoc?.slug || fb) ??
					crypto.randomUUID();
				if (fallbackData && typeof fallbackData === "string") {
					return formatUserHandle(fallbackData);
				}
			}

			return "@" + value;
		};

export function sanitizeHandle(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots
		.replace(/^\.*/g, "") // 3. remove leading dots
		.replace(/\.*$/g, "") // 4. remove trailing dots
		.replace(/_\._/g, ".").replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/\._/g, "_") // 6. remove any lingering dot-underscore patterns
		.replace(/_\./g, "_") // 7. remove underscore-dot patterns
		.slice(0, 30); // 8. max length
}
