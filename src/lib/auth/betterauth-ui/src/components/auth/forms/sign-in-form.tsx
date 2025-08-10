"use client";

import type {BetterFetchOption} from "@better-fetch/fetch";
import {zodResolver} from "@hookform/resolvers/zod";
import {Loader2} from "lucide-react";
import {useContext, useEffect} from "react";
import {useForm} from "react-hook-form";
import * as z from "zod";
import "@/styles/__inputs.scss";
import {useCaptcha} from "../../../hooks/use-captcha";
import {useIsHydrated} from "../../../hooks/use-hydrated";
import {useOnSuccessTransition} from "../../../hooks/use-success-transition";
import {AuthUIContext} from "../../../lib/auth-ui-provider";
import {
	cn,
	getLocalizedError,
	getPasswordSchema,
	isValidEmail,
} from "../../../lib/utils";
import type {AuthLocalization} from "../../../localization/auth-localization";
import type {PasswordValidation} from "../../../types/password-validation";
import {Captcha} from "../../captcha/captcha";
import {PasswordInput} from "../../password-input";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../ui/form";
import {Input} from "@/components/ui/input";
import type {AuthFormClassNames} from "../auth-form";

export interface SignInFormProps {
	className?: string;
	classNames?: AuthFormClassNames;
	isSubmitting?: boolean;
	localization: Partial<AuthLocalization>;
	redirectTo?: string;
	setIsSubmitting?: (isSubmitting: boolean) => void;
	passwordValidation?: PasswordValidation;
}

export function SignInForm({
	className,
	classNames,
	isSubmitting,
	localization,
	redirectTo,
	setIsSubmitting,
	passwordValidation,
}: SignInFormProps) {
	const isHydrated = useIsHydrated();
	const {captchaRef, getCaptchaHeaders} = useCaptcha({localization});

	const {
		authClient,
		basePath,
		credentials,
		localization: contextLocalization,
		viewPaths,
		navigate,
		toast,
		Link,
	} = useContext(AuthUIContext);

	const rememberMeEnabled = credentials?.rememberMe;
	const usernameEnabled = credentials?.username;
	const contextPasswordValidation = credentials?.passwordValidation;

	localization = {...contextLocalization, ...localization};
	passwordValidation = {...contextPasswordValidation, ...passwordValidation};

	const {onSuccess, isPending: transitionPending} = useOnSuccessTransition({
		redirectTo,
	});

	const formSchema = z.object({
		email: usernameEnabled
			? z.string().min(1, {
				message: `${localization.USERNAME} ${localization.IS_REQUIRED}`,
			})
			: z.string().min(1, {
				message: `${localization.EMAIL} ${localization.IS_REQUIRED}`,
			}).email({
				message: `${localization.EMAIL} ${localization.IS_INVALID}`,
			}),
		password: getPasswordSchema(passwordValidation, localization),
		rememberMe: z.boolean().optional(),
	});

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: !rememberMeEnabled,
		},
	});

	isSubmitting =
		isSubmitting || form.formState.isSubmitting || transitionPending;

	useEffect(() => {
		setIsSubmitting?.(form.formState.isSubmitting || transitionPending);
	}, [form.formState.isSubmitting, transitionPending, setIsSubmitting]);

	async function signIn({
		email,
		password,
		rememberMe,
	}: z.infer<typeof formSchema>) {
		try {
			let response: Record<string, unknown> = {};

			if (usernameEnabled && !isValidEmail(email)) {
				const fetchOptions: BetterFetchOption = {
					throw: true,
					headers: await getCaptchaHeaders("/sign-in/username"),
				};

				response = await authClient.signIn.username({
					username: email,
					password,
					rememberMe,
					fetchOptions,
				});
			} else {
				const fetchOptions: BetterFetchOption = {
					throw: true,
					headers: await getCaptchaHeaders("/sign-in/email"),
				};

				response = await authClient.signIn.email({
					email,
					password,
					rememberMe,
					fetchOptions,
				});
			}

			if (response.twoFactorRedirect) {
				navigate(
					`${basePath}/${viewPaths.TWO_FACTOR}${window.location.search}`,
				);
			} else {
				await onSuccess();
			}
		} catch (error) {
			form.resetField("password");

			toast({
				variant: "error",
				message: getLocalizedError({error, localization}),
			});
		}
	}

	return (
		<Form {...form}>
			<form className="text-xs flex flex-col gap-7 my-5" onSubmit={form.handleSubmit(signIn)}
			      noValidate={isHydrated}>
				<div className="my-3 text-xs">
					<FormField control={form.control} name="email" render={({field}) => (
						<FormItem className={"relative form-field active col-span-full"}>
							<FormControl>
								<Input className={cn("w-input", classNames?.input)}
								       type={usernameEnabled ? "text" : "email"} placeholder={
									usernameEnabled
										? localization.SIGN_IN_USERNAME_PLACEHOLDER
										: localization.EMAIL_PLACEHOLDER
								} disabled={isSubmitting}
								       {...field} />
							</FormControl>
							<div data-form={"baseline"} />
							<FormLabel className={cn("input-label", classNames?.label)}>
								{usernameEnabled ? localization.USERNAME : localization.EMAIL}
							</FormLabel>
							<FormMessage className={classNames?.error} />
						</FormItem>
					)} />
				</div>
				<div className="my-3">
					<FormField control={form.control} name="password" render={({field}) => (
						<FormItem className={"relative form-field active col-span-full"}>
							<FormControl>
								<PasswordInput autoComplete="current-password"
								               className={cn("w-input", classNames?.input)}
								               placeholder={localization.PASSWORD_PLACEHOLDER}
								               disabled={isSubmitting}
								               {...field} />
							</FormControl>
							<div data-form={"baseline"} />
							<FormLabel className={cn("input-label", classNames?.label)}>
								{localization.PASSWORD}
							</FormLabel>
							<FormMessage className={classNames?.error} />
						</FormItem>
					)} />
					<div className="flex items-center justify-between mt-4">
						{credentials?.forgotPassword && (
							<span
								className="relative mx-1 p-0 inline-flex items-center justify-center group">
                <Link
	                className="decoration-0 no-underline hover:text-foreground transition-colors duration-200 ease"
	                href={`${basePath}/${viewPaths.FORGOT_PASSWORD}${isHydrated ? window.location.search : ""}`}>
                  {localization.FORGOT_PASSWORD_LINK}
                </Link>
                <span
	                className="absolute bottom-[.5px] left-0 h-[1px] w-full scale-x-0 origin-left bg-foreground/80 transition-transform duration-300 ease group-hover:scale-x-100 z-0"></span>
                <span
	                className="absolute bottom-[.5px] left-0 h-[1px] w-full scale-x-100 origin-right bg-[oklch(var(--muted-faded-bg)/.8)] transition-transform duration-300 ease group-hover:scale-x-0 z-0"></span>
              </span>
						)}
					</div>
				</div>
				{rememberMeEnabled && (
					<FormField control={form.control} name="rememberMe" render={({field}) => (
						<FormItem className="flex">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange}
								          disabled={isSubmitting} />
							</FormControl>
							<FormLabel>{localization.REMEMBER_ME}</FormLabel>
						</FormItem>
					)} />
				)}
				<Captcha ref={captchaRef} localization={localization} action="/sign-in/email" />
				<Button type="submit" disabled={isSubmitting}
					// className={cn(
					//   "w-full",
					//   classNames?.button,
					//   classNames?.primaryButton,
					// )}
					    className="focus-visible:ring-ring text-faded-foreground hover:bg-[oklch(var(--off-bg)/.5)] hover:*:text-off-foreground *:transition-colors *:duration-300 *:ease inline-flex h-14 min-h-[35px] w-full items-center justify-center gap-[8px] rounded-md border border-[oklch(var(--faded-fg)/.65)] bg-[oklch(var(--off-bg)/.3)] px-4 py-3 text-lg leading-1 font-suit font-light tracking-wide uppercase whitespace-nowrap shadow-sm transition-colors duration-300 ease focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0">
					<div className={
						"flex flex-col items-center justify-center w-full h-full"
					}>
						{isSubmitting ? (
							<Loader2 className="animate-spin" />
						) : (
							localization.SIGN_IN_ACTION
						)}
					</div>
				</Button>
			</form>
		</Form>
	);
}
