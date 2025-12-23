"use client";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import type {ReactElement} from "react";

import {useTranslation} from "@payloadcms/ui";

import "./ContentEditable.scss";

import type {SanitizedClientEditorConfig} from "@payloadcms/richtext-lexical";
import {ContentEditable} from "@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable";

export function LexicalContentEditable({
	                                       className,
	                                       editorConfig
                                       }: {
	className?: string;
	editorConfig: SanitizedClientEditorConfig;
}): ReactElement {
	const {t} = useTranslation<{}, string>();
	const [_, {getTheme}] = useLexicalComposerContext();
	const theme = getTheme();

	return (
		<ContentEditable
			aria-placeholder={t("lexical:general:placeholder")}
			className={className ?? "ContentEditable__root"}
			placeholder={
				<p className={theme?.placeholder}>
					{editorConfig?.admin?.placeholder ?? t("lexical:general:placeholder")}
				</p>
			}
		/>
	);
}
