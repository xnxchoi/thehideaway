import {DefaultValues, FieldErrors, FieldValues, FormProvider} from "react-hook-form";

import {Form as MuiForm} from "@base-ui/react";
import {useIsoLayoutEffect} from "@base-ui/utils/useIsoLayoutEffect";
import {
	FormStore,
	FormStoreOptions
} from "@/payload/fields/Article/Cover/ImageNode/Forms/workaround/FormStore";
import {cn} from "@/lib/utils";
import type {ComponentPropsWithoutRef, FormEvent, ReactNode,} from "react";
import {useCallback, useEffect, useState} from "react";

export interface FormProps<TValues extends FieldValues = FieldValues> extends ComponentPropsWithoutRef<"form"> {
	className?: string;
	children: ReactNode;
	defaultValues?: DefaultValues<TValues>;
	validateOnMount?: boolean;
	fluid?: boolean;
	store?: FormStore<TValues>;
	disabled?: boolean;
	onStoreInit?: (store: FormStore<TValues>) => void;
	onFormSubmit?: (formValues: TValues, eventDetails: MuiForm.SubmitEventDetails) => void;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Form {
	export type Props<TValues extends FieldValues = FieldValues> = FormProps<TValues>;
	export type SubmitEventDetails = MuiForm.SubmitEventDetails;
	export type Errors<TValues extends FieldValues = FieldValues> = FieldErrors<TValues>;
}

export function createStore<TValues extends FieldValues>(options: FormStoreOptions<TValues>): FormStore<TValues> {
	return new FormStore<TValues>({mode: "onTouched", delayError: 600, ...options});
}

function deepEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== "object" || typeof b !== "object") return false;

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	if (keysA.length !== keysB.length) return false;

	for (const key of keysA) {
		if (!keysB.includes(key)) return false;
		if (!deepEqual(a[key], b[key])) return false;
	}

	return true;
}

export function Form<FormValues extends FieldValues = FieldValues>(props: FormProps<FormValues>) {
	const {
		className,
		validateOnMount = false,
		fluid,
		store,
		defaultValues,
		disabled,
		children,
		onStoreInit,
		onFormSubmit,
		...rest
	} = props;

	const [internalStore] = useState(() => store ?? createStore({defaultValues}));

	const formState = internalStore.useState("formState");

	const {control, trigger, handleSubmit, ...formMethods} = internalStore.form;

	useIsoLayoutEffect(() => {
		const unsubscribe = control._subscribe({
			formState: control._proxyFormState,
			callback: (state) => {
				internalStore.updateFormState({...state});
			},
			reRenderRoot: true,
		});

		const {unsubscribe: valuesUnsubscribe} = control._subjects.state.subscribe({
			next: (state) => {
				if (state.type == "change" && state.values) {
					internalStore._values = state.values;
					internalStore.updateValues(state.values);
				}
			},
		});

		control._formState.isReady = true;
		internalStore.updateFormState({isReady: true});

		return () => {
			unsubscribe();
			valuesUnsubscribe();
		};
	}, [control, internalStore]);

	useEffect(() => {
		return internalStore.observe("values", (values) => {
			if (values && !deepEqual(values, internalStore._values)) {
				control._reset(values, {
					keepFieldsRef: true,
					...control._options.resetOptions,
				});
				if (!control._options.resetOptions?.keepIsValid) {
					control._setValid();
				}
				internalStore._values = values;
				internalStore.updateFormState({...control._formState});
			} else {
				control._resetDefaultValues();
			}
		});
	}, [control, internalStore]);

	useEffect(() => {
		if (control._proxyFormState.isDirty) {
			const isDirty = control._getDirty();
			if (isDirty !== formState.isDirty) {
				control._subjects.state.next({
					isDirty,
				});
			}
		}
	}, [control, formState.isDirty]);

	useEffect(() => {
		if (!control._state.mount) {
			control._setValid();
			control._state.mount = true;
		}

		if (control._state.watch) {
			control._state.watch = false;
			control._subjects.state.next({...control._formState});
		}

		control._removeUnmounted();
	});

	useEffect(() => {
		if (!store && onStoreInit) {
			onStoreInit(internalStore);
		}
	}, [store, onStoreInit, internalStore]);

	useEffect(() => control._disableForm(disabled), [control, disabled]);

	useEffect(() => {
		if (validateOnMount) {
			trigger();
		}
	}, [trigger, validateOnMount]);

	const wrappedHandleSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			if (onFormSubmit) {
				handleSubmit((values) => {
					onFormSubmit(values, {reason: "none", event: e.nativeEvent});
				})(e);
			}
		},
		[handleSubmit, onFormSubmit]
	);

	return (
		<FormProvider
			control={control}
			trigger={trigger}
			handleSubmit={handleSubmit}
			formState={formState}
			{...formMethods}>
			<MuiForm className={cn("form", {fluid}, className)}
			         onSubmit={wrappedHandleSubmit} {...rest}>
				{children}
			</MuiForm>
		</FormProvider>
	);
}