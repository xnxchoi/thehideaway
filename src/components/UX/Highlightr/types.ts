import type * as rangey from "rangy";
import {Citation} from "@/payload-types";

export type RangeSaveParams = {
	userId: string;
	selection: {
		text: string;
		before: string;
		after: string;
	};
	cited: string;
	reference: string;
	quote: string;
	path: string;
	color: string;
	memo?: string;
	private?: boolean;
};
export type ProcessedRangy = {
	id?: string;
	cited?: string;
	quote?: string;
	selection: {
		text: string;
		before: string;
		after: string;
	};
	color: string;
	memo?: string | null;
	private?: boolean;
	reference: string;
	createdAt: string;
	path: string;
};
export type HighlightedRange = ProcessedRangy & {
	range: rangey.RangyRange;
	els: Element[];
};

export type StoredRange = ProcessedRangy & {};

export interface ClientRange extends ProcessedRangy {
	els?: Element[];
	range?: rangey.RangyRange;
}

export type CitationRange = Pick<
	Citation,
	| "selection"
	| "id"
	| "private"
	| "reference"
	| "color"
	| "createdAt"
	| "quote"
	| "path"
	| "memo"
>;
