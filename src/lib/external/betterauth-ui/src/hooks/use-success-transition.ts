"use client";
import {
	useCallback,
	useContext,
	useRef,
	useTransition,
} from "react";
import {AuthUIContext} from "../lib/auth-ui-provider";
import {getSearchParam} from "../lib/utils";
import {normalizeLocalReturnTo} from "@/lib/routes/auth";

export function useOnSuccessTransition({
	redirectTo: redirectToProp,
}: {
	redirectTo?: string;
}) {
	const {redirectTo: contextRedirectTo} = useContext(AuthUIContext);

	const getRedirectTo = useCallback(
		() =>
			normalizeLocalReturnTo(
				redirectToProp || getSearchParam("redirectTo") || contextRedirectTo,
				normalizeLocalReturnTo(contextRedirectTo, "/"),
			),
		[redirectToProp, contextRedirectTo],
	);

	const [isPending, startTransition] = useTransition();
	const hasStartedNavigation = useRef(false);

	const {
		navigate,
		hooks: {useSession},
	} = useContext(AuthUIContext);

	const {refetch: refetchSession} = useSession();

	const onSuccess = useCallback(async () => {
		await refetchSession?.();
		if (hasStartedNavigation.current) return;

		hasStartedNavigation.current = true;

		startTransition(() => {
			navigate(getRedirectTo());
		});
	}, [refetchSession, navigate, getRedirectTo]);

	return {onSuccess, isPending};
}
