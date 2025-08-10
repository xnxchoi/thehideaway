import type {
	SerializedHeadingNode,
	SerializedLinkNode,
	SerializedParagraphNode,
} from "@payloadcms/richtext-lexical";
import type {SerializedLexicalNode, SerializedTextNode} from "lexical";

declare interface N {
	p: SerializedParagraphNode<"text">;
}

declare interface Lx extends N {
	p: (
		param: (Partial<SerializedParagraphNode> & { text: string }) | string,
	) => SerializedParagraphNode;
	h: <T extends SerializedHeadingNode["tag"]>(props: {
		tag: T;
	}) => SerializedHeadingNode & { tag: T };
	a: (
		props: Partial<SerializedLinkNode> & {
			href: string;
		},
	) => SerializedLinkNode;
}

type LxFn<T extends SerializedLexicalNode> = (p: Partial<T> | T[keyof T]) => T;
export const pN = (
	p: (Partial<SerializedParagraphNode> & { text: string }) | string,
): SerializedParagraphNode & {
	children: SerializedTextNode[];
	type: "paragraph";
	direction: null | "rtl" | "ltr" | "ttb" | "btt";
} =>
	typeof p === "string"
		? {
			type: "paragraph",
			direction: null,
			format: "",
			indent: 0,
			textFormat: 0,
			textStyle: "",
			children: [
				{
					text: p,
					type: "text",
					mode: "normal",
				},
			],
		}
		: {
			type: "paragraph",
			direction: null,
			format: "",
			indent: 0,
			textFormat: 0,
			textStyle: "",

			children: [
				{
					text: p.text,
				},
			],
			...p,
		};
export const lx: Lx = {};
