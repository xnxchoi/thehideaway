import {formatUserHandle} from "./formatUserHandle";

export function generateSmartSlugCandidates({
	base,
	username,
	email,
	maxAttempts = 3,
}: {
	base: string;
	username?: string;
	email: string;
	maxAttempts?: number;
}): string[] {
	const candidates = new Set<string>();

	const emailName = email?.split("@")[0];
	const usernameClean = username ? formatUserHandle(username) : null;
	const emailClean = emailName ? formatUserHandle(emailName) : null;

	candidates.add(base + "__" + usernameClean);
	// username/email based
	if (usernameClean) candidates.add(`${usernameClean}__`);
	if (emailClean) candidates.add(`${emailClean}__`);
	const chars = ["x", "_", "1"];
	const charLength = chars.length;
	// numeric fallback
	for (let i = 1; i <= maxAttempts; i++) {
		let cand = base;
		const random = Math.random();
		const char =
			chars[Math.min(Math.floor(random * charLength), charLength - 1)];
		for (let k = 0; k < i; k++) {
			const pos = Math.ceil(Math.exp(random * 2) * 7) % 2;
			cand = pos === 0 ? char + cand : cand + char;
		}
		candidates.add(cand);
	}

	return Array.from(candidates);
}
