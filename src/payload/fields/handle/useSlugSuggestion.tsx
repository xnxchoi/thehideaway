import {useEffect, useState} from "react";
import {
	formatUserHandle,
	HANDLE_TEST_REGEX,
} from "@/payload/fields/handle/handleFormat";

export function useSlugSuggestion({
	value,
	onAccept,
}: {
	value: string;
	onAccept: (suggested: string) => void;
}) {
	const [suggestion, setSuggestion] = useState<string | null>(null);
	const [showHint, setShowHint] = useState(false);

	useEffect(() => {
		const sanitized = formatUserHandle(value);

		const isNonAscii = /[^\x00-\x7F]/.test(value);
		const isInvalid = !HANDLE_TEST_REGEX.test(sanitized);

		if (
			(isNonAscii || isInvalid) &&
			sanitized !== value &&
			sanitized.length > 0
		) {
			setSuggestion(sanitized);
			setShowHint(true);
		} else {
			setSuggestion(null);
			setShowHint(false);
		}
	}, [value]);

	useEffect(() => {
		if (!suggestion) return;

		const handler = (e: KeyboardEvent) => {
			if (e.key === "Tab" || e.key === " ") {
				e.preventDefault();
				onAccept(suggestion);
				setShowHint(false);
				setSuggestion(null);
			}
		};

		window.addEventListener("keydown", handler, {once: true});
		return () => window.removeEventListener("keydown", handler);
	}, [suggestion, onAccept]);

	return {suggestion, showHint};
}
