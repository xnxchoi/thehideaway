import {FingerprintIcon} from "lucide-react";
import {useContext} from "react";

import {useOnSuccessTransition} from "../../hooks/use-success-transition";
import {AuthUIContext} from "../../lib/auth-ui-provider";
import {cn, getLocalizedError} from "../../lib/utils";
import type {AuthLocalization} from "../../localization/auth-localization";
import {Button} from "@/components/ui/button";
import type {AuthCardClassNames} from "./auth-card";

interface PasskeyButtonProps {
	classNames?: AuthCardClassNames;
	isSubmitting?: boolean;
	localization: Partial<AuthLocalization>;
	redirectTo?: string;
	setIsSubmitting?: (isSubmitting: boolean) => void;
}

export function PasskeyButton({
	classNames,
	isSubmitting,
	localization,
	redirectTo,
	setIsSubmitting,
}: PasskeyButtonProps) {
	const {
		authClient,
		localization: contextLocalization,
		toast,
	} = useContext(AuthUIContext);

	localization = {...contextLocalization, ...localization};

	const {onSuccess} = useOnSuccessTransition({redirectTo});

	const signInPassKey = async () => {
		setIsSubmitting?.(true);

		try {
			const response = await authClient.signIn.passkey({
				fetchOptions: {throw: true},
			});

			if (response?.error) {
				toast({
					variant: "error",
					message: getLocalizedError({
						error: response.error,
						localization,
					}),
				});

				setIsSubmitting?.(false);
			} else {
				onSuccess();
			}
		} catch (error) {
			toast({
				variant: "error",
				message: getLocalizedError({error, localization}),
			});

			setIsSubmitting?.(false);
		}
	};

	return (
		<Button className={cn(
			"focus-visible:ring-ring text-foreground hover:bg-[oklch(var(--faded-bg)/.65)] hover:*:text-off-foreground *:transition-colors *:duration-300 *:ease inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border border-[oklch(var(--faded-fg)/.65)] bg-[oklch(var(--off-bg)/.3)] px-4 py-3 text-md font-medium whitespace-nowrap shadow-sm transition-colors duration-300 ease focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0",
			classNames?.form?.button,
			classNames?.form?.secondaryButton,
		)} disabled={isSubmitting} formNoValidate name="passkey" value="true"
		        data-themed={"background-color,color"} variant="outline" onClick={signInPassKey}>
			<FingerprintIcon />
			{localization.SIGN_IN_WITH} {localization.PASSKEY}
		</Button>
	);
}
