"use client";
import type {ComboboxEntry} from "@payloadcms/ui";
import type {} from "payload";

import "./index.scss";

import {useLexicalEditable} from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import {
	ChevronIcon,
	Combobox,
	CopyToClipboard,
	PopupList,
	RenderFields,
	useForm,
	useFormFields,
	useTranslation
} from "@payloadcms/ui";
import React from "react";

import type {AdditionalCodeComponentProps} from "./Code";

import {useBlockComponentContext} from "@payloadcms/richtext-lexical/client";
import {Collapse} from "./Collapse/index";
import {defaultLanguages} from "./defaultLanguages";
import {FloatingCollapse} from "./FloatingCollapse/index";

const baseClass = "payload-richtext-code-block";
export const CodeBlockBlockComponent: React.FC<
	Pick<AdditionalCodeComponentProps, "languages">
> = (args) => {
	const {languages: languagesFromProps} = args;
	const languages = languagesFromProps || defaultLanguages;

	const {BlockCollapsible, formSchema, RemoveButton} =
		useBlockComponentContext();
	const {setModified} = useForm();
	const {t} = useTranslation();

	const {codeField} = useFormFields(([fields]) => ({
		codeField: fields?.code
	}));

	const {selectedLanguageField, setSelectedLanguage} = useFormFields(
		([fields, dispatch]) => ({
			selectedLanguageField: fields?.language,
			setSelectedLanguage: (language: string) => {
				dispatch({
					type: "UPDATE",
					path: "language",
					value: language
				});
				setModified(true);
			}
		})
	);

	const selectedLanguageLabel =
		languages[selectedLanguageField?.value as keyof typeof languages];

	const isEditable = useLexicalEditable();

	const languageEntries = React.useMemo<ComboboxEntry[]>(() => {
		return Object.entries(languages).map(([languageCode, languageLabel]) => ({
			name: `${languageCode} ${languageLabel}`,
			Component: (
				<PopupList.Button
					active={false}
					disabled={false}
					onClick={() => {
						setSelectedLanguage(languageCode);
					}}
				>
          <span
	          className={`${baseClass}__language-code`}
	          data-language={languageCode}
          >
            {languageLabel}
          </span>
				</PopupList.Button>
			)
		}));
	}, [languages, setSelectedLanguage]);

	return (
		<BlockCollapsible
			Actions={
				<div className={`${baseClass}__actions`}>
					<Combobox
						button={
							<div
								className={`${baseClass}__language-selector-button`}
								data-selected-language={selectedLanguageField?.value}
							>
								<span>{selectedLanguageLabel}</span>
								<ChevronIcon className={`${baseClass}__chevron`}/>
							</div>
						}
						buttonType="custom"
						className={`${baseClass}__language-selector`}
						disabled={!isEditable}
						entries={languageEntries}
						horizontalAlign="right"
						minEntriesForSearch={8}
						searchPlaceholder={t("fields:searchForLanguage")}
						showScrollbar
						size="large"
					/>
					<CopyToClipboard value={(codeField?.value as string) ?? ""}/>

					<Collapse/>

					{isEditable && <RemoveButton/>}
				</div>
			}
			className={baseClass}
			collapsibleProps={{
				AfterCollapsible: <FloatingCollapse/>,
				disableHeaderToggle: true,
				disableToggleIndicator: true
			}}
			Pill={
				<div className={`${baseClass}__pill`}>
					<svg
						fill="none"
						height="12"
						viewBox="0 0 15 12"
						width="15"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M11.3738 8.62598L14.0404 5.95931L11.3738 3.29264M3.37376 3.29264L0.707092 5.95931L3.37376 8.62598M9.04043 0.625977L5.70709 11.2926"
							stroke="currentColor"
							strokeLinecap="square"
						/>
					</svg>
				</div>
			}
		>
			<RenderFields
				fields={formSchema}
				forceRender={true}
				parentIndexPath=""
				parentPath={""}
				parentSchemaPath=""
				permissions={true}
				readOnly={!isEditable}
			/>
		</BlockCollapsible>
	);
};
