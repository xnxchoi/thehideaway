"use client";
import "./index.scss";
import {Operation, TextFieldClientProps} from "payload";
import {
	ChangeEvent,
	FC,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {useField} from "@payloadcms/ui";
import {
	formatUserHandle,
	formatUserHandleLite,
	HANDLE_TEST_REGEX,
} from "@/payload/fields/handle/formatUserHandle";
import {cn} from "@/lib/utils";
import {toast} from "sonner";
import {HandleError, HandleResponse, HandleSuccess} from "./types";
import {stringify} from "qs-esm";

export type UserHandleComponentProps = {
	fieldToUse: string;
	operation: Operation;
	path: string;
	serverURL: string;
	startValue?: string | null;
	userId: string;
	editorId: string;
} & TextFieldClientProps;
export const HandleComponent: FC<UserHandleComponentProps> = ({
	fieldToUse = "name",
	path,
	userId,
	editorId,
	operation,
	startValue,
	readOnly: readOnlyFromProps,
	serverURL,
	field,
	permissions,
}) => {
	const TTL = useMemo(() => 1000 * 60 * 15, []);

	const {value, setValue} = useField<string>({path});
	const {value: unValue, setValue: setUserName} = useField<string>({
		path: "username",
	});
	const validateUniqueness = useCallback(
		async (value: string | null) => {
			if (!value) {
				setIsError(true);
				setInternalError("Value is required");

				return new Error("Value is required");
			}
			const queryObj =
				operation === "create"
					? {
						operation,
						user: editorId,
						handle: value,
					}
					: operation === "update"
						? {
							operation,
							user: editorId,
							handle: value,
							id: userId,
						}
						: null;
			if (!queryObj) return;

			const reqp = `${serverURL}/api/users/validateHandle?${stringify(queryObj)}`;
			try {
				const res = await fetch(reqp, {
					method: "POST",
					credentials: "include",
				});
				const sugg: HandleResponse = await res.json();
				setShouldValidate(false);
				if (res.ok) {
					setInternalError(null);
					setIsError(false);
					suggestionRef.current = null;
					setShouldShowSuggestion(false);
					setValue((sugg as HandleSuccess).handle);
					lastValidValue.current = {
						value: (sugg as HandleSuccess).handle,
						time: performance.now(),
					};
					return {
						message: "Handle is unique",
						handle: (sugg as HandleSuccess).handle,
					};
				} else {
					const s = sugg as HandleError;
					if ("error" in s) {
						setIsError(true);
						setInternalError(s.error);
						return new Error(s.error);
					}

					if (lastValidValue.current) {
						if (performance.now() - lastValidValue.current.time < TTL) {
							suggestionRef.current = lastValidValue.current.value;
							setShouldShowSuggestion(true);
						}
					}

					setIsError(true);
					setInternalError(`The handle ${value} already exists`);
					return new Error(`The handle ${value} already exists`);
				}
			} catch (e) {
				setIsError(true);
				return e;
			}
		},
		[operation, userId, editorId, serverURL, setValue, TTL],
	);
	const {setValue: setLabelValue} = useField<string>({
		path: "displayUsername",
	});
	const {value: nameValue, setValue: setNameValue} = useField<string>({
		path: "name",
	});
	const [textValue, setTextValue] = useState(value);
	const lastValidValue = useRef({value, time: performance.now()});
	const [focused, setFocused] = useState(false);
	const [internalError, setInternalError] = useState<string | null>(null);
	const suggestionRef = useRef<string | null>(null);
	const [isError, setIsError] = useState<boolean>(false);
	const [shouldValidate, setShouldValidate] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null!);
	const [ghostText, setGhostText] = useState(value ?? "");
	const sanitizeRef = useRef<ReturnType<typeof setTimeout>>(null);

	const shouldSanitizeRef = useRef(false);
	const lastToastID = useRef<string | number | null>(null);
	const validateRef = useRef<ReturnType<typeof setTimeout>>(null);
	const textValueRef = useRef(textValue);
	const realTimeSanitize = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value;
		const sV = formatUserHandleLite(v);
		textValueRef.current = sV;
		setTextValue(sV);
	}, []);
	useEffect(() => {
		sanitizeRef.current && clearTimeout(sanitizeRef.current);
		sanitizeRef.current = setTimeout(() => {
			const isValid = HANDLE_TEST_REGEX.test(textValue);
			if (!isValid) {
				setIsError(true);
				setShouldValidate(false);
				toast.error("Invalid handle");
				return;
			} else {
				setIsError(false);
				if (lastValidValue.current.value !== textValue) {
					setShouldValidate(true);
				}
			}
		}, 550);
	}, [textValue]);

	useEffect(() => {
		validateRef.current &&
		(clearTimeout(validateRef.current), (validateRef.current = null));
		if (shouldValidate && !focused) {
			validateRef.current = setTimeout(() => {
				const tv = textValueRef.current;
				const promise = validateUniqueness(tv);
				lastToastID.current && toast.dismiss(lastToastID.current);
				lastToastID.current = null;
				toast.promise(promise, {
					loading: "Validating...",
					success: (data: { message: string }) => {
						return {
							message: data.message,
							style: {
								backgroundColor: "var(--color-foreground)",
								color: "var(--color-bleu-900)",
							},
							duration: 4000,
						};
					},
					error: (error: Error) => ({
						message: error.message,
						style: {
							backgroundColor: "var(--color-foreground)",
							color: "var(--color-rouge-900)",
						},
						duration: 4000,
					}),
				});
			}, 100);
		}
	}, [shouldValidate, validateUniqueness, focused]);

	const sanitizerCallback = useCallback((v: string) => {
		const sanitized = formatUserHandle(v);
		shouldSanitizeRef.current = false;
		return sanitized;
	}, []);

	const [shouldShowSuggestion, setShouldShowSuggestion] = useState(false);
	const renderGhostText = useCallback((valued: string, suggestiond: string) => {
		return setGhostText(
			suggestiond.length > valued.length && suggestiond.includes(valued)
				? valued.replace(/[^a-zA-Z0-9]/g, " ") +
				suggestiond.slice(valued.length)
				: suggestiond,
		);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Tab" || e.key === " ") {
				e.preventDefault();
				if (suggestionRef.current) {
					setValue(suggestionRef.current);
				}
				setShouldShowSuggestion(false);
				suggestionRef.current = null;

				setInternalError(null);
			} else if (
				e.ctrlKey ||
				e.metaKey ||
				e.altKey ||
				e.key.startsWith("Arrow")
			) {
				return;
			} else {
				setShouldShowSuggestion(false);
				suggestionRef.current = null;
				setInternalError(null);
			}
		},
		[setValue],
	);

	useEffect(() => {
		if (suggestionRef.current && shouldShowSuggestion) {
			renderGhostText(textValue, suggestionRef.current);
			inputRef.current.addEventListener("keydown", onKeyDown);
		} else {
			inputRef.current.removeEventListener("keydown", onKeyDown);
		}
	}, [onKeyDown, renderGhostText, shouldShowSuggestion, textValue]);

	useEffect(() => {
		setTextValue(value);
		setNameValue(value);
		setUserName(value);
		setLabelValue(`@${value}`);
	}, [setLabelValue, setNameValue, value]);

	if (!editorId) {
		return <></>;
	}
	if (operation === "update") {
		if (!userId) {
			return <></>;
		}
	}
	return (
		<div className="field-type handle-field-component">
			<label htmlFor="slugInput"
			       className="my-2 text-foreground data-[error=true]:text-rouge-700 transition-colors ease duration-200"
			       data-error={isError} data-themed={"color"}>
				Username
			</label>
			<div className="flex flex-col gap-2 relative">
				<div
					className="flex flex-col absolute w-full inset-0 justify-end data-[has-label=true]:mt-[24px]"
					data-has-label={true} data-error={isError} data-focus={focused}>
					<div className="h-full flex flex-col">
						<div
							className="w-full inline-flex tap-highlight-transparent flex-row items-center px-3 gap-3 !px-1 !pb-0 !gap-0 box-border shadow-[0_1px_0px_0_rgba(0,0,0,0.05)] !rounded-none h-10 min-h-10 rounded-medium transition-background !duration-150 border-b-[1px] border-transparent relative is-filled">
							<div
								className="inline-flex w-full items-center h-full box-border pb-1.5">
								<div className="pointer-events-none flex items-center">
									<span className="opacity-0">@</span>
								</div>
								<input data-filled="true" readOnly={true} disabled={true}
								       data-filled-within="true" data-has-start-content="true"
								       size={
									       suggestionRef.current?.length ?? textValue.length + 1 ?? 15
								       }
								       className="font-normal bg-transparent !outline-hidden placeholder:text-transparent focus-visible:outline-hidden data-[has-start-content=true]:ps-1.5 data-[has-end-content=true]:pe-1.5 data-[type=color]:rounded-none autofill:bg-transparent text-[14px] is-filled font-mono text-muted-foreground/40 transition-all opacity-0 data-[show=true]:opacity-100 data-[show=true]:fade-in pl-[4px] pb-0"
								       aria-label=" " type="text" id="ghostInput" value={ghostText}
								       data-show={shouldShowSuggestion} title="" />
								{shouldShowSuggestion && (
									<div
										className="animate-in fade-in duration-150 ease-linear text-[10px] font-faded-foreground/40 flex items-center justify-center gap-1">
										<kbd className="text-muted-fg/40 text-xs font-mono">
											Tab
										</kbd>
										<span> to accept</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
				<div
					className="group flex flex-col w-full inset-0 justify-end data-[has-label=true]:mt-[24px]"
					data-has-label={true} data-error={isError} data-focus={focused}
					data-filled={textValue.length > 0} data-has-value={textValue.length > 0}>
					<div className="h-full flex flex-col">
						<div className={cn(
							"w-full inline-flex tap-highlight-transparent flex-row items-center px-3 gap-3 !px-1 !pb-0 !gap-0 box-border shadow-[0_1px_0px_0_rgba(0,0,0,0.05)] border-default-200 !rounded-none after:content-[''] after:w-0 after:origin-center after:bg-default-foreground after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-[2px] group-data-[focus=true]:after:w-full h-10 min-h-10 rounded-medium transition-background motion-reduce:transition-none !duration-150 motion-reduce:after:transition-none border-b-[1px] after:transition-colors after:ease after:duration-200 after:h-px relative",
							{"is-filled": textValue.length > 0},
							{"after:bg-rouge-700": isError},
						)}>
							<div
								className="inline-flex w-full items-center h-full box-border pb-1.5">
								<div className="pointer-events-none flex items-center">
                  <span className={cn(
	                  "text-[14px] text-faded-foreground data-[focus=true]:text-faded-foreground/40 duration-200 ease-in-out transition-colors data-[error=true]:text-rouge-700",
                  )} data-error={isError} data-focus={focused}>
                    @
                  </span>
								</div>
								<input data-filled="true" readOnly={readOnlyFromProps}
								       onBlur={() => setFocused(false)}
								       onFocus={() => setFocused(true)} data-error={isError}
								       data-filled-within="true" data-has-start-content="true"
								       data-has-end-content="true" maxLength={30} ref={inputRef}
								       className="w-full font-normal bg-transparent placeholder:text-foreground-500 !outline-none !border-none data-[has-start-content=true]:ps-1.5 data-[has-end-content=true]:pe-1.5 data-[type=color]:rounded-none autofill:bg-transparent bg-clip-text group-data-[has-value=true]:text-foreground text-[14px] font-mono transition-colors ease duration-200 data-[error=true]:text-rouge-700 pb-0 pl-[2px]"
								       aria-label=" " style={{
									backgroundColor: "transparent",
									border: "none",
									outline: "none",
									boxShadow: "none",
								}} type="text" id="slugInput" value={value}
								       onChange={realTimeSanitize} title="" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
