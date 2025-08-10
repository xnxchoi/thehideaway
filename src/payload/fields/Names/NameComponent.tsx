"use client";
import "./index.scss";
import {TextFieldClientProps} from "payload";
import {
	FC,
	useCallback,
	useEffect,
	useRef,
	useState
} from "react";
import {useField} from "@payloadcms/ui";
import {Input as HeroInput} from "@heroui/react";
import {sanitizeNameValues, sanitizeNameLite, sanitizeName} from "@/utilities/sanitizeNameValues";

type NameComponentProps = {} & TextFieldClientProps;

export const NameComponent: FC<NameComponentProps> = ({

	path,

	readOnly: readOnlyFromProps,
	field,
	permissions,
}) => {
	const {value, setValue} = useField<string>({path});
	const [focused, setFocused] = useState(false);
	const [textValue, setTextValue] = useState(value);

	const sanitizeRef = useRef<ReturnType<typeof setTimeout>>(null)
	const setSanitizedValue = useCallback((value: string) => {
		const sanitized = sanitizeNameLite(value)
		setTextValue(sanitized)
		sanitizeRef.current && clearTimeout(sanitizeRef.current)
		sanitizeRef.current = setTimeout(() => {
			const sanitized = sanitizeName(value)
			setValue(sanitized)
		}, 150)
	}, [setValue, sanitizeNameLite, sanitizeNameValues])
	const [isError, setIsError] = useState<boolean>(false);

	useEffect(() => {
		if (!focused) {
			const sanitized = sanitizeNameValues(textValue)
			setValue(sanitized)
		}
	}, [focused])

	const inputRef = useRef<HTMLInputElement>(null!);

	useEffect(() => {
		setTextValue(value);
	}, [value]);


	const readOnly = readOnlyFromProps ?? false;

	return (
		<div className="field-type w-[45%] max-md:w-full flex-grow">
			<div className="my-2 text-[12px]">{field?.label?.toString() ?? ""}</div>
			<div className="flex flex-col gap-2">
				<HeroInput ref={inputRef} disabled={readOnly} readOnly={readOnly} classNames={{
					inputWrapper: "border-b-[1px] after:h-px data-[error=true]:after:bg-rouge-700 after:transition-colors after:duration-300 after:ease-linear",
					input: "text-[16px] data-[error=true]:text-rouge-700 transition-colors duration-300 ease-linear",
				}} onFocusChange={setFocused} data-error={isError} variant="underlined"
				           value={textValue} onValueChange={setSanitizedValue} />
			</div>
		</div>
	);
};
