import {
	createFormControl,
	DefaultValues,
	ErrorOption,
	FieldErrors,
	FieldPath,
	FieldPathValue,
	FieldValues,
	FormState,
	UseFormProps,
	UseFormReturn,
} from "react-hook-form";

import {createSelector, ReactStore} from "@base-ui/utils/store";

/**
 *  Implments a temporary workaround for a form issue in base-ui
 *  Downside: Added dependency on react-hook-form
 */
export interface FormStoreState<TValues extends FieldValues = FieldValues> {
	formState: FormState<TValues>;
	values: TValues;
}

export type FormStoreOptions<TValues extends FieldValues = FieldValues> = UseFormProps<TValues>;

function createFormSelectors<TValues extends FieldValues>() {
	return {
		formState: createSelector((state: FormStoreState<TValues>) => state.formState),
		errors: createSelector((state: FormStoreState<TValues>) => state.formState.errors),
		values: createSelector((state: FormStoreState<TValues>) => state.values),
		isDirty: createSelector((state: FormStoreState<TValues>) => state.formState.isDirty),
		isValid: createSelector((state: FormStoreState<TValues>) => state.formState.isValid),
		isSubmitting: createSelector((state: FormStoreState<TValues>) => state.formState.isSubmitting),
		isValidating: createSelector((state: FormStoreState<TValues>) => state.formState.isValidating),
		submitCount: createSelector((state: FormStoreState<TValues>) => state.formState.submitCount),
		dirtyFields: createSelector((state: FormStoreState<TValues>) => state.formState.dirtyFields),
		touchedFields: createSelector((state: FormStoreState<TValues>) => state.formState.touchedFields),
		errorCount: createSelector(
			(state: FormStoreState<TValues>) => state.formState.errors != null && Object.keys(state.formState.errors).length
		),
		hasErrors: createSelector(
			(state: FormStoreState<TValues>) =>
				state.formState.errors != null && Object.keys(state.formState.errors).length > 0
		),
	};
}

function createFormState<TValues extends FieldValues>(
	initialState: Partial<FormState<TValues>> = {}
): FormState<TValues> {
	return {
		isDirty: false,
		isValidating: false,
		isLoading: false,
		isSubmitted: false,
		isSubmitting: false,
		isSubmitSuccessful: false,
		isValid: false,
		submitCount: 0,
		dirtyFields: {},
		touchedFields: {},
		validatingFields: {},
		errors: {},
		disabled: false,
		isReady: false,
		...initialState,
	};
}

type Selectors<TValues extends FieldValues> = ReturnType<typeof createFormSelectors<TValues>>;

// Form store wrapper built on top of react-hook-form’s internal createFormControl API
// (see: https://github.com/react-hook-form/react-hook-form/blob/master/src/useForm.ts)
export class FormStore<TValues extends FieldValues = FieldValues> extends ReactStore<
	FormStoreState<TValues>,
	Record<string, never>,
	Selectors<TValues>
> {
	readonly form: Omit<UseFormReturn<TValues>, "formState">;

	_values?: TValues;

	constructor(options: FormStoreOptions<TValues> = {}) {
		super(
			{
				formState: createFormState(),
				values: {} as TValues,
			},
			{},
			createFormSelectors<TValues>()
		);

		const {formControl: _, ...rest} = createFormControl<TValues>(options);

		this.form = {
			...rest,
		};

		this.form.control._proxyFormState.isValid = "all";
		this.form.control._proxyFormState.isDirty = "all";
		this._values = options.values;
	}

	updateFormState(updates: Partial<FormState<TValues>>): void {
		this.set("formState", {
			...this.state.formState,
			...updates,
		});
	}

	updateValues(updates: Partial<TValues>): void {
		this.set("values", {
			...this.state.values,
			...updates,
		});
	}

	updateValue<TFieldName extends FieldPath<TValues>>(
		field: TFieldName,
		value: FieldPathValue<TValues, TFieldName>
	): void {
		this.set("values", {
			...this.state.values,
			[field]: value,
		});
	}

	setFieldValue<TFieldName extends FieldPath<TValues>>(
		field: TFieldName,
		value: FieldPathValue<TValues, TFieldName>
	): void {
		this.form.control._subjects.state.next({
			name: field,
			type: "change",
			values: {
				...this.state.values,
				[field]: value,
			},
		});
	}

	setFieldError<TFieldName extends FieldPath<TValues>>(field: TFieldName, error: ErrorOption): void {
		this.form.setError(field, error);
	}

	setValues(values: Partial<TValues>): void {
		(Object.keys(values) as Array<FieldPath<TValues>>).forEach((key) => {
			const value = values[key as keyof TValues];
			if (value !== undefined) {
				this.form.setValue(key, value);
			}
		});
	}

	setErrors(errors: FieldErrors<TValues>): void {
		this.form.control._setErrors(errors);
	}

	reset(values?: DefaultValues<TValues>): void {
		this.form.reset(values);
	}
}