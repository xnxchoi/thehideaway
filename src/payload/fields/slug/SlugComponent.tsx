"use client";

import "./index.scss";

import {
	Button,
	TextInput,
	useDocumentInfo,
	useField,
	useForm,
	useFormFields,
} from "@payloadcms/ui";
import type {TextFieldClientProps} from "payload";
import React, {useCallback, useEffect, useState} from "react";
import {formatSlug} from "./formatSlug";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {LockClosedIcon, LockOpen2Icon} from "@radix-ui/react-icons";

type SlugComponentProps = {
	fieldToUse: string;
	checkboxFieldPath: string;
} & TextFieldClientProps;

export const SlugComponent: React.FC<SlugComponentProps> = ({
	field,
	fieldToUse,
	checkboxFieldPath: checkboxFieldPathFromProps,
	path,

	readOnly: readOnlyFromProps,
}) => {
	const {label} = field;
	const checkboxFieldPath = path?.includes(".")
		? `${path}.${checkboxFieldPathFromProps}`
		: checkboxFieldPathFromProps;
	const {value, setValue} = useField<string>({path: path || field.name});

	const {dispatchFields} = useForm();

	const checkboxValue = useFormFields(([fields]) => {
		return fields[checkboxFieldPath]?.value as string;
	});

	const targetFieldValue = useFormFields(([fields]) => {
		return fields[fieldToUse]?.value as string;
	});
	const {id} = useDocumentInfo();

	// const { onMouseEnter, onMouseLeave } = useDomCursor({})

	const [ghostValue, setGhostValue] = useState("");
	const [ghostSize, setGhostSize] = useState(0);
	useEffect(() => {
		const ghost = value?.length > 0 && id ? `-${id}` : "";
		setGhostValue(ghost);
		setGhostSize(ghost?.length + 1);
	}, [id, value]);

	useEffect(() => {
		if (checkboxValue) {
			if (targetFieldValue) {
				const formattedSlug = formatSlug(targetFieldValue);

				setValue(formattedSlug);
			} else {
				if (value !== "") setValue("");
			}
		}
	}, [targetFieldValue, checkboxValue, setValue, value]);

	const handleLock = useCallback(
		(e) => {
			e.preventDefault();

			dispatchFields({
				type: "UPDATE",
				path: checkboxFieldPath,
				value: !checkboxValue,
			});
		},
		[checkboxValue, checkboxFieldPath, dispatchFields],
	);
	// const setCursor = useCursorStore((l) => l.setCursorState)

	const readOnly = readOnlyFromProps || checkboxValue;

	return (
		<div className="field-type slug-field-component relative">
			<div className="flex gap-2 items-center justify-start w-full">
				<label htmlFor={`field-${path}`} className="text-muted-foreground">
					Slug :{" "}
				</label>
				<div
					// onMouseEnter={onMouseEnter}
					// onMouseLeave={onMouseLeave} className="flex">
					<Button className="flex gap-2 justify-center items-center" buttonStyle="none"
					        onClick={handleLock}>
						{checkboxValue ? (
							<LockClosedIcon className="w-4 h-4" />
						) : (
							<LockOpen2Icon className="w-4 h-4" />
						)}
						{checkboxValue ? "Auto" : "Manual"}
					</Button>
				</div>
			</div>
			<div className="relative">
				<TextInput value={value} onChange={setValue} BeforeInput={
					<style>{`  
            input:not(.ghost):not([disabled]):not([readOnly=true]){
              font-family: var(--font-mono);
              background: transparent;
              z-index: 10;
              position: relative;
            }
            input::placeholder{
              background: transparent;
              font-family: var(--font-mono);
            }
          `}</style>
				} AfterInput={
					<div
						className="flex absolute top-0 bg-transparent right-0 left-0 w-full h-full">
              <span
	              className="ghost -z-[1] text-foreground border-transparent transition-all duration-300 ease-power4 opacity-0"
	              style={{
		              fontFamily: "var(--font-mono)",
		              background: "transparent",
		              flexGrow: 0,
		              borderColor: "transparent",
		              flexShrink: 0,
		              width: "fit-content",
		              paddingRight: 0,
		              boxShadow: "none",
	              }}>
                {" "}
	              {value}
              </span>
						<Tooltip>
							<div
								className="group -z-[1] opacity-0 data-[active=false]:opacity-100 data-[active=false]:z-[10] transition-all duration-300 ease-power4"
								data-active={checkboxValue}
								// onMouseEnter={() => setCursor("FOCUS")}
								// onMouseLeave={() => setCursor(null)}
							>
								<TooltipTrigger asChild>
									<input value={ghostValue} type="text"
									       onChange={(e) => setGhostValue(e.target.value)}
									       size={ghostSize}
									       className="ghost -z-[1] text-[oklch(var(--muted-faded-fg)/.5)] border-transparent transition-all duration-300 ease-power4 group-hover:text-foreground"
									       style={{
										       boxShadow: "none",
										       fontFamily: "var(--font-mono)",
										       background: "transparent",
										       borderColor: "transparent",
										       paddingLeft: 0,
										       flex: "1 1 0%",
									       }} data-active={checkboxValue} readOnly={true} />
								</TooltipTrigger>
								<TooltipContent sideOffset={-10} align={"start"} alignOffset={5}>
									<span className="text-warm-beige">ID</span>
									<span> of this post.</span>
								</TooltipContent>
							</div>
						</Tooltip>
					</div>
				} path={path || field.name} style={{
					background: "transparent",
					fontFamily: "var(--font-mono)",
				}} readOnly={Boolean(readOnly)} />
			</div>
		</div>
	);
};
