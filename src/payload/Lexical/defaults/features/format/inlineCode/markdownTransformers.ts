import {TextFormatTransformer} from "@payloadcms/richtext-lexical/lexical/markdown";

export const INLINE_CODE: TextFormatTransformer = {
	type: "text-format",
	format: ["code"],
	tag: "`",
}
