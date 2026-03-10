import { locales } from "@/i18n/request";
import messages from "messages/en.json";
import { RangyRange, RangySelection } from "rangy/lib/rangy-core";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}
declare module "*.glsl" {
  const file: string;
  export default file;
}
declare module "*.frag" {
  const file: string;
  export default file;
}
declare module "*.vert" {
  const value: string;
  export default value;
}

export type Direction =
  | "forward"
  | "forwards"
  | "backward"
  | "backwards"
  | boolean;
export type NodeType =
  | "NODE_BEFORE"
  | "NODE_AFTER"
  | "NODE_BEFORE_AND_AFTER"
  | "NODE_INSIDE";

export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
}

export interface DomPosition {
  node: Node;
  offset: number;
}

export type RangyStatic = typeof import("rangy");

declare module "rangy" {
  interface RangySelection extends Selection {
    nativeSelection: Selection;
    rangeCount: number;
    isCollapsed: boolean;
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;

    addRange(range: RangyRange, direction?: Direction | boolean): void;

    getRangeAt(index: number): RangyRange;

    isBackwards(): boolean;

    removeAllRanges(): void;

    removeRange(range: RangyRange): void;

    refresh(checkForChanges?: boolean): any;

    collapse(node: Node, offset: number): void;

    collapseToStart(): void;

    setSingleRange(range: RangyRange, direction?: Direction): void;

    collapseToEnd(): void;

    selectAllChildren(node: Node): void;

    deleteFromDocument(): void;

    toString(): string;

    toHtml(): string;

    getAllRanges(): RangyRange[];

    getNativeTextRange(): Range;

    getSingleRange(range: RangyRange, direction: Direction): any;

    setRanges(ranges: RangyRange[]): any;

    containsNode(node: Node, partial: boolean): boolean;

    getBookmark(containerNode: Node): any;

    moveToBookmark(bookmark: object): any;

    saveRanges(): object;

    restoreRanges(saved: object): any;

    detach(): any;

    inspect(): string;
  }

  interface RangyRange extends Range {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
    commonAncestorContainer: Node;
    collapsed: boolean;

    setStart(node: Node, offset: number): void;

    setStartBefore(node: Node): void;

    setStartAfter(node: Node): void;

    setEnd(node: Node, offset: number): void;

    setEndBefore(node: Node): void;

    setEndAfter(node: Node): void;

    setStartAndEnd(
      startNode: Node,
      startOffset: number,
      endNode?: Node,
      endOffset?: number
    ): any;

    selectNode(node: Node): any;

    selectNodeContents(node: Node): any;

    collapse(toStart?: boolean): void;

    compareBoundaryPoints(comparisonType: number, range: RangyRange): number;

    insertNode(node: Node): any;

    cloneContents(): DocumentFragment;

    extractContents(): DocumentFragment;

    deleteContents(): void;

    canSurroundContents(): boolean;

    surroundContents(node: Node): boolean;

    cloneRange(): RangyRange;

    isValid(): boolean;

    toString(): string;

    toHtml(): string;

    compareNode(node: Node): NodeType;

    comparePoint(node: Node, offset: number): -1 | 0 | 1;

    intersectsOrTouchesRange(range: RangyRange): boolean;

    intersectsRange(range: RangyRange): boolean;

    intersectsNode(node: Node, touchingIsIntersecting?: boolean): boolean;

    intersection(range: RangyRange): RangyRange | null;

    union(range: RangyRange): RangyRange | null;

    isPointInRange(node: Node, offset: number): boolean;

    createContextualFragment(fragment: string): DocumentFragment;

    containsNode(node: Node, partial: boolean): boolean;

    containsNodeContents(node: Node): boolean;

    containsNodeText(node: Node): boolean;

    containsRange(range: RangyRange): boolean;

    splitBoundaries(): any;

    normalizeBoundaries(): any;

    collapseToPoint(node: Node, offset: number): any;

    collapseBefore(node: Node): any;

    collapseAfter(node: Node): any;

    getNodes(nodeTypes?: any[], filter?: (node: Node) => boolean): Node[];

    getBookmark(containerNode?: Node): { start: number; end: number };

    moveToBookmark(bookmark: object): any;

    getDocument(): Document;

    inspect(): string;

    equals(range: RangyRange): boolean;

    refresh(): any;

    select(): any;

    detach(): void;

    text(): string;

    nativeRange: Range;
  }
}

export type Direction =
  | "forward"
  | "forwards"
  | "backward"
  | "backwards"
  | boolean;
export type NodeType =
  | "NODE_BEFORE"
  | "NODE_AFTER"
  | "NODE_BEFORE_AND_AFTER"
  | "NODE_INSIDE";

export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
}

export interface DomPosition {
  node: Node;
  offset: number;
}

export type RangyStatic = typeof import("rangy");

declare module "rangy/lib/rangy-selectionsaverestore" {}
export type RangeSaveInfo = {
  document: Document;
  startMarkerId: string;
  endMarkerId: string;
  collapsed: boolean;
  backward: boolean;
  toString: () => string;
};
declare global {
  namespace rangy {
    interface savedSelection {
      win?: Window;
      rangeInfos: RangeSaveInfo[];
      restored: boolean;
    }
    function saveSelection(win?: Window): savedSelection;

    function restoreSelection(
      savedSelection: savedSelection,
      preserveDirection?: boolean
    ): boolean;

    function saveRange(range: Range): RangeSaveInfo;

    function restoreRange(
      savedRange: RangeSaveInfo,
      normalize?: boolean
    ): Range;

    function saveRanges(
      ranges: Range[],
      direction?: Direction | boolean
    ): RangeSaveInfo[];

    function restoreRanges(savedRanges: RangeSaveInfo[]): Range[];

    function removeMarkers(savedSelection: savedSelection): void;

    function getNativeSelection(win?: Window): Selection;

    function getSelection(win?: Window): RangySelection;

    function createRange(
      doc?: Document | Window | HTMLIFrameElement
    ): RangyRange;

    function createRangyRange(
      doc?: Document | Window | HTMLIFrameElement
    ): RangyRange;

    function createNativeRange(
      doc?: Document | Window | HTMLIFrameElement
    ): Range;

    function addInitListener(listener: (rangy: RangyStatic) => void): void;

    function createMissingNativeApi(): void;

    function shim(): void;

    function serializeSelection(
      selection?: RangySelection,
      omitChecksum?: boolean,
      root?: Node
    ): string;

    function canDeserializeSelection(
      serializedSelection: string,
      root?: Node,
      win?: Window
    ): boolean;

    function deserializeSelection(
      serializedSelection: string,
      root?: Node,
      win?: Window
    ): RangySelection;

    function serializeRange(
      range: RangyRange,
      omitChecksum?: boolean,
      root?: Node
    ): string;

    function canDeserializeRange(
      serializedRange: string,
      root?: Node,
      doc?: Document
    ): boolean;

    function deserializeRange(
      serializedRange: string,
      root?: Node,
      doc?: Document
    ): RangyRange;

    function serializePosition(node: Node, offset: number, root?: Node): string;

    function deserializePosition(
      serializedPosition: string,
      root?: Node,
      doc?: Document
    ): DomPosition;

    function restoreSelectionFromCookie(win?: Window): boolean;

    function isHostObject(obj: any, prop: string): boolean;

    function isHostMethod(obj: any, method: string): boolean;

    function isHostProperty(obj: any, prop: string): boolean;

    function areHostObjects(obj: any, props: string[]): boolean;

    function areHostMethods(obj: any, methods: string[]): boolean;

    function areHostProperties(obj: any, props: string[]): boolean;

    function toArray(arrayLike: any): any[];

    function serializeSelection(
      selection?: RangySelection,
      omitChecksum?: boolean,
      root?: Node
    ): string;

    function canDeserializeSelection(
      serializedSelection: string,
      root?: Node,
      win?: Window
    ): boolean;

    function deserializeSelection(
      serializedSelection: string,
      root?: Node,
      win?: Window
    ): RangySelection;

    function serializeRange(
      range: RangyRange,
      omitChecksum?: boolean,
      root?: Node
    ): string;

    function canDeserializeRange(
      serializedRange: string,
      root?: Node,
      doc?: Document
    ): boolean;

    function deserializeRange(
      serializedRange: string,
      root?: Node,
      doc?: Document
    ): RangyRange;

    function serializePosition(node: Node, offset: number, root?: Node): string;

    function deserializePosition(
      serializedPosition: string,
      root?: Node,
      doc?: Document
    ): DomPosition;

    function saveSelectionCookie(win?: Window, props?: CookieOptions): void;

    function restoreSelectionFromCookie(win?: Window): boolean;

    interface SelectionSaveRestoreModule {
      saveSelection(win?: Window): object | null;

      restoreSelection(
        savedSelection: object,
        preserveDirection?: boolean
      ): boolean;

      saveRange(range: Range): object;

      restoreRange(savedRange: object, normalize?: boolean): Range;

      saveRanges(ranges: Range[], direction?: Direction | boolean): object[];

      restoreRanges(savedRanges: object[]): Range[];

      removeMarkers(savedSelection: object): void;
    }

    interface RangyClassApplierOptions {
      elementTagName?: string;
      elementProperties?: { [key: string]: string };
      elementAttributes?: { [key: string]: string };
      ignoreWhiteSpace?: boolean;
      applyToEditableOnly?: boolean;
      tagNames?: string[] | string;
      normalize?: boolean;
      onElementCreate?:
        | ((element: Element, classApplier: RangyClassApplier) => any)
        | undefined;
      useExistingElements?: boolean;
    }

    interface RangyClassApplier {
      applyToSelection(win?: Window): void;

      undoToSelection(win?: Window): void;

      isAppliedToSelection(win?: Window): boolean;

      toggleSelection(win?: Window): void;

      applyToRange(range: RangyRange): void;

      undoToRange(range: RangyRange): void;

      isAppliedToRange(range: RangyRange): boolean;

      toggleRange(range: RangyRange): void;

      detach(doc?: Document | Window | HTMLIFrameElement): void;

      className: string;
      cssClass: string;
    }

    function createClassApplier(
      className: string,
      options?: RangyClassApplierOptions,
      tagNames?: string[] | string
    ): RangyClassApplier;

    interface RangyHighlighter {
      addClassApplier(
        classApplier: RangyClassApplier,
        options?: RangyHighlighterAddClassOptions
      ): void;

      highlightSelection(
        className: string,
        options?: RangyHighlightOptions
      ): string[];

      unhighlightSelection(selection?: RangySelection): boolean;

      removeAllHighlights(): void;

      serialize(highlights?: RangyHighlight[]): string;

      deserialize(serialized: string): RangyHighlight[];

      getHighlightForElement(el: Element): RangyHighlight | null;
    }

    interface RangyHighlighterAddClassOptions {
      priority?: number;
      exclusive?: boolean;
    }

    interface RangyHighlightOptions {
      selection?: RangySelection;
      exclusive?: boolean;
      containerElementId?: string;
    }

    interface RangyHighlight {
      id: string;
      classApplier: RangyClassApplier;
      characterRange: {
        start: number;
        end: number;
        containerElement: Node;
      };

      containsElement(el: Node): boolean;

      containsRange(range: RangyRange): boolean;

      intersectsRange(range: RangyRange): boolean;

      isCharacterRange(containerElement: Node): boolean;

      getRange(containerElement?: Node): RangyRange;
    }

    function createHighlighter(
      doc?: Document | Window | HTMLIFrameElement,
      type?: "textContent" | "textRange"
    ): RangyHighlighter;

    interface RangyWordOptions {
      includeTrailingSpace?: boolean;
      wordRegex?: RegExp;
    }

    interface RangyCharacterOptions {
      includeBlockContentTrailingSpace?: boolean;
      includeSpaceBeforeBr?: boolean;
      includePreLineTrailingSpace?: boolean;
      ignoreCharacters?: string;
    }

    interface RangyTextOptions
      extends RangyWordOptions, RangyCharacterOptions {}

    interface RangyFindTextOptions {
      caseSensitive?: boolean;
      withinRange?: RangyRange;
      wholeWordsOnly?: boolean;
      wrap?: boolean;
      direction?: "forward" | "backward";
      wordOptions?: RangyWordOptions;
      characterOptions?: RangyCharacterOptions;
    }

    interface RangyTextExpandOptions extends RangyTextOptions {
      trim?: boolean;
      trimStart?: boolean;
      trimEnd?: boolean;
    }

    interface RangyTextRange {
      moveStart(
        unit: string,
        count: number,
        options?: RangyTextOptions
      ): number;

      moveEnd(unit: string, count: number, options?: RangyTextOptions): number;

      move(unit: string, count: number, options?: RangyTextOptions): number;

      expand(unit: string, options?: RangyTextExpandOptions): boolean;

      text(): string;

      selectCharacters(
        containerNode: Node,
        startIndex: number,
        endIndex: number
      ): void;

      toCharacterRange(
        containerNode: Node,
        options?: RangyTextOptions
      ): { start: number; end: number };

      findText(
        searchTerm: string | RegExp,
        options?: RangyFindTextOptions
      ): boolean;
    }
  }
}
export { PlaceHolderImage } from "@/components/core/Media/Image/PlaceHolderImage";
