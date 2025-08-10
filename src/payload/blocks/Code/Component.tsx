import React from "react";

import {Code} from "./Component.client";
import type {CodeBlock as CodeBlockProps} from "@/payload-types";
import {nanoid} from "nanoid";
import {md5} from "hash-wasm";

export type Props = CodeBlockProps & {
	className?: string;
};

export const CodeBlock: React.FC<Props> = ({className, code, language}) => {
	return (
		<div data-selectable={true} data-hash={md5(code)} id={nanoid(17)}
		     className={[className, "not-prose"].filter(Boolean).join(" ")}>
			<Code code={code} language={language ?? "typescript"} />
		</div>
	);
};
