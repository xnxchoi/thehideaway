import type * as rangey from "rangy";
import { Citation } from "@/payload-types";
import { HighlightColors } from "@/components/UX/Highlightr/stores";
import { AuthorOverview } from "@collections/Posts/post-types";

export type RangeSaveParams = {
  author: string;
  selection: {
    text: string;
    before: string;
    after: string;
  };
  target: {
    value: string;
    relationTo: Citation["target"]["relationTo"];
  };
  cited: string;
  reference: string;
  quote: string;
  path: string;
  color: HighlightColors;
  memo?: string;
  private?: boolean;
  _status?: "published" | "draft";
};
export type PreppedRangy = {
  id?: string;
  cited: string;
  quote?: string;
  selection: {
    text: string;
    before: string;
    after: string;
  };
  author: AuthorOverview;
  color: HighlightColors;
  memo?: string | null;
  private?: boolean;
  reference: string;
  createdAt: string;
  updatedAt?: string;
  path: string;
};
export type ProcessedRangy = Omit<PreppedRangy, "updatedAt" | "id"> & {
  id: string;
  updatedAt: string;
};
export type HighlightedRange = ProcessedRangy & {
  range: rangey.RangyRange;
  els: Element[];
};

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
