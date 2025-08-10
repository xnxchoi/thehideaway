import type {Margins} from "pdfmake/interfaces";

export const logoBase =
	"data:image/png;base64,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";

export interface PDFMakeTextProps {
	text: string;
	fontSize?: number;
	bold?: boolean;
	italics?: boolean;
	margin?: Margins;
	alignment?: "left" | "center" | "right";
	lineHeight?: number;
	style?: string;
}

export function textMake(
	text: string | PDFMakeTextProps,
	options?: PDFMakeTextProps,
) {
	if (typeof text === "string") {
		return {text, ...options};
	}

	return {...text, ...options};
}

export function stack(
	children: PDFMakeTextProps[],
	options?: {
		width?: string | number;
		margin?: Margins;
		alignment?: "left" | "center" | "right";
		style?: string;
		lineHeight?: number;
		fontSize?: number;
		bold?: boolean;
		italics?: boolean;
	},
) {
	return {stack: children, ...options};
}
