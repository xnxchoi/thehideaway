import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
  type TextNode
} from "@payloadcms/richtext-lexical/lexical";

interface SelectionInfoBase {
  offset: number;
  type: "text" | "element";
  textContent: string;
  selection: RangeSelection;
  prevNode: LexicalNode | null;
  nextNode: LexicalNode | null;
  parentNode: ElementNode | null;
  cursorAtStartOfNode: boolean;
  cursorAtEndOfNode: boolean;
  wordCharBeforeCursor: boolean;
  wordCharAfterCursor: boolean;
  spaceBeforeCursor: boolean;
  spaceAfterCursor: boolean;
}

interface TextNodeSelectionInfo extends SelectionInfoBase {
  isTextNode: true;
  node: TextNode;
}

interface LexicalNodeSelectionInfo extends SelectionInfoBase {
  isTextNode: false;
  node: LexicalNode;
}

type SelectionInfo =
  | TextNodeSelectionInfo
  | LexicalNodeSelectionInfo
  | undefined;

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION
};

// Makes it possible to use brackets before the trigger: (@mention)
export const PRE_TRIGGER_CHARS = "\\(";
export const LENGTH_LIMIT = 75;

export const PUNC = DocumentMentionsRegex.PUNCTUATION;

export const TRIGGERS = "(?!" + ["@"].join("|") + ")";

// Chars we expect to see in a mention (non-space, non-punctuation).
export const VALID_CHARS = TRIGGERS + "[^\\s" + PUNC + "]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
export const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  " |" + // E.g. " " in "Josh Duck"
  "[" +
  PUNC +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

export const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    VALID_JOINS +
    "){0," +
    LENGTH_LIMIT +
    "})" +
    ")$"
);

// Regex used to match alias.
export const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    "){0," +
    LENGTH_LIMIT +
    "})" +
    ")$"
);

// At most, 5 suggestions are shown in the popup.
export const SUGGESTION_LIST_LENGTH_LIMIT = 10;

export function isWordChar(char: string) {
  return new RegExp(VALID_CHARS).test(char);
}

export function $getSelectionInfo(): SelectionInfo {
  const selection = $getSelection();
  if (!selection || !$isRangeSelection(selection)) {
    return;
  }

  const anchor = selection.anchor;
  const focus = selection.focus;
  const [node] = selection.getNodes();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (anchor.key !== focus.key || anchor.offset !== focus.offset || !node) {
    return;
  }

  const isTextNode = $isTextNode(node) && node.isSimpleText();
  const type = anchor.type;
  const offset = anchor.offset;
  const textContent = node.getTextContent();
  const cursorAtStartOfNode = offset === 0;
  const cursorAtEndOfNode = textContent.length === offset;
  const charBeforeCursor = textContent.charAt(offset - 1);
  const charAfterCursor = textContent.charAt(offset);
  const wordCharBeforeCursor = isWordChar(charBeforeCursor);
  const wordCharAfterCursor = isWordChar(charAfterCursor);
  const spaceBeforeCursor = /\s/.test(charBeforeCursor);
  const spaceAfterCursor = /\s/.test(charAfterCursor);
  const prevNode = node.getPreviousSibling();
  const nextNode = node.getNextSibling();
  const parentNode = node.getParent();

  const props = {
    node,
    type,
    offset,
    isTextNode,
    textContent,
    selection,
    prevNode,
    nextNode,
    parentNode,
    cursorAtStartOfNode,
    cursorAtEndOfNode,
    wordCharBeforeCursor,
    wordCharAfterCursor,
    spaceBeforeCursor,
    spaceAfterCursor
  };

  if (isTextNode) {
    return {
      ...props,
      isTextNode: true,
      node
    };
  } else {
    return {
      ...props,
      isTextNode: false,
      node
    };
  }
}
