import { RP_IMG_DMA } from "@/payload/fields/Article/Cover/rp-image/client/nodeTODomMap";
import { $convertRPImageElement } from "@/payload/fields/Article/Cover/rp-image/server/node/conversions";
import { ImageCollectionSlug } from "@/types/collections/image-collections";
import { clamp } from "@/utilities/mathUtilities";
import { StronglyTypedLeafNode } from "@payloadcms/richtext-lexical";
import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode
} from "@payloadcms/richtext-lexical/lexical/react/LexicalDecoratorBlockNode";

import ObjectID from "bson-objectid";
import { $applyNodeReplacement } from "@payloadcms/richtext-lexical/lexical";
import type { JSX } from "react";
import { OptionalKeys } from "ts-essentials";

export type UploadedImageBlock<
  T extends ImageCollectionSlug = ImageCollectionSlug
> = {
  /**
   * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
   */
  id: string;
  relationTo: T;
  pending?: false;
  placeholder?: false;
  /**
   * Value can be just the document ID, or the full, populated document
   */
  value: string;
} & RP_InternalImageNodeData;
export type PendingUploadImageBlock<
  T extends ImageCollectionSlug = ImageCollectionSlug
> = {
  /**
   * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
   */
  id: string;
  relationTo: T;
  placeholder?: false;
  pending: {
    formID: string;
    src: string;
  };
} & RP_InternalImageNodeData;

export type EmptyImageBlock<
  TX extends ImageCollectionSlug = ImageCollectionSlug
> = {
  id: string;

  relationTo: TX;
  pending?: false;
  placeholder: true;
};
export type RP_ImageData<T extends ImageCollectionSlug = ImageCollectionSlug> =
  {
    [TX in ImageCollectionSlug]:
      | UploadedImageBlock<TX>
      | PendingUploadImageBlock<TX>
      | EmptyImageBlock<TX>;
  }[T];
export type RP_InternalImageNodeData = {
  src: string;
  width?: number;
  height?: number;
  blurDataUrl?: string | null;
  caption?: string | null;
  showCaption?: boolean;
  alt: string;
  span: number;
  sizes?: string | null;
  darkmode?: boolean;
};
/**
 * Internal use only - UploadData type that can contain a pending state
 * @internal
 */
export type Internal_RPImageData<
  T extends ImageCollectionSlug = ImageCollectionSlug
> = {
  pending?: {
    formID: string;
    src?: string;
  };
} & RP_ImageData<T>;
export type SerializedRPImageNode = StronglyTypedLeafNode<
  SerializedDecoratorBlockNode,
  "rp-image"
> &
  RP_ImageData;

export class RPImageServerNode extends DecoratorBlockNode {
  __collection: ImageCollectionSlug;
  __value: null | string = null;
  __form: {
    formID: string;
    src?: string;
  } | null = null;
  __showCaption: boolean = false;
  __src: string | null = null;
  __height: number | null = null;
  __width: number | null = null;
  __alt: string = "Photo by ";
  __sizes?: string | null = null;
  __darkmode: boolean = false;
  __placeholder: boolean = true;
  __pending: boolean = false;

  __caption?: string | null = null;
  __span: number = 640;
  __nodeID: string;

  constructor({
    data,
    format,
    key
  }: {
    data: RP_ImageData;
    format?: ElementFormatType;
    key?: NodeKey;
  }) {
    super(format, key);
    this.__nodeID = data.id;
    this.__collection = data.relationTo;
    this.__value = null;
    this.__src = null;
    this.__darkmode = false;
    this.__span = 640;
    this.__alt = "Photo by";
    this.__caption = undefined;
    this.__showCaption = false;
    this.__height = null;
    this.__width = null;
    this.__sizes = null;
    this.__form = null;
    if (!data.placeholder) {
      const {
        src,
        showCaption,
        sizes,
        span,
        alt,
        caption,
        height,
        width,
        darkmode
      } = data;
      if (!data.pending) {
        const { value } = data;
        this.__value = value;
      }

      this.__src = src || null;
      this.__darkmode = darkmode || false;
      span && (this.__span = span);
      this.__alt = alt || "";
      this.__caption = caption || null;
      this.__height = height || null;
      this.__width = width || null;
      this.__sizes = sizes || null;
      this.__showCaption = showCaption || false;
    }
    if (data.pending) {
      this.__form = data.pending;
    }
  }

  static override clone(node: RPImageServerNode): RPImageServerNode {
    return new this({
      data: node.getData(),
      format: node.__format,
      key: node.__key
    });
  }

  static override getType(): string {
    return "rp-image";
  }

  static override importDOM(): DOMConversionMap<HTMLImageElement> {
    return {
      img: (node) => ({
        conversion: (domNode) =>
          $convertRPImageElement(
            domNode as HTMLImageElement,
            $createRPImageServerNode
          ),
        priority: 0
      })
    };
  }

  static override importJSON(
    serializedNode: SerializedRPImageNode
  ): RPImageServerNode {
    if (!serializedNode?.id) {
      serializedNode.id = ObjectID().toHexString();
      serializedNode.version = 3;
    }

    const { id, format, relationTo, version, type, ...rest } = serializedNode;
    if (!!rest.placeholder) {
      const node = $createRPImageServerNode({
        data: { id, relationTo, placeholder: true }
      });
      node.setFormat(format);
      return node;
    } else if (!!rest.pending) {
      const {
        alt,
        height,
        width,
        src,
        sizes,
        span,
        showCaption,
        caption,
        darkmode
      } = rest;
      const node = $createRPImageServerNode({
        data: {
          id,
          relationTo,
          pending: { formID: rest.pending.formID, src: rest.pending.src },
          src,
          width,
          height,
          blurDataUrl: null,
          caption,
          showCaption,
          alt,
          span,
          sizes,
          darkmode
        }
      });
      node.setFormat(format);
      return node;
    } else {
      const e = {
        value: rest.value,
        src: rest.src,
        width: rest.width,
        height: rest.height,
        blurDataUrl: rest.blurDataUrl,
        caption: rest.caption,
        showCaption: rest.showCaption,
        alt: rest.alt,
        span: rest.span,
        sizes: rest.sizes,
        darkmode: rest.darkmode
      };
      const node = $createRPImageServerNode({ data: { id, relationTo, ...e } });
      node.setFormat(format);
      return node;
    }
  }

  static isInline(): false {
    return false;
  }

  override createDOM(config?: EditorConfig): HTMLElement {
    const element = document.createElement("div");

    return element;
  }

  override decorate(): JSX.Element {
    return null as unknown as JSX.Element;
  }

  override exportDOM(): DOMExportOutput {
    const nodeId = this.__nodeID;
    const relationTo = this.__collection;

    if (this.__placeholder || !this.__src || !this.__value) {
      const element = document.createElement("div");
      element.setAttribute(RP_IMG_DMA.PREFIX + RP_IMG_DMA.nodeId, nodeId);
      element.setAttribute(
        RP_IMG_DMA.PREFIX + RP_IMG_DMA.relationTo,
        relationTo
      );
      return { element };
    }
    const element = document.createElement("img");
    element.setAttribute(RP_IMG_DMA.PREFIX + RP_IMG_DMA.nodeId, nodeId);
    element.setAttribute(RP_IMG_DMA.PREFIX + RP_IMG_DMA.relationTo, relationTo);
    this.__form &&
      element.setAttribute(
        RP_IMG_DMA.PREFIX + RP_IMG_DMA.pending.formID,
        this.__form.formID
      );

    element.setAttribute("src", this.__src);
    element.setAttribute(RP_IMG_DMA.PREFIX + RP_IMG_DMA.value, this.__value);
    this.__form &&
      this.__form.src &&
      element.setAttribute(
        RP_IMG_DMA.PREFIX + RP_IMG_DMA.pending.src,
        this.__form.src
      );
    return { element };
  }

  override exportJSON(): SerializedRPImageNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: "rp-image",
      version: 3
    };
  }

  getData(): RP_ImageData {
    const imfo = this.getLatest();
    const {
      __placeholder,
      __value,
      __form,
      __width,
      __src,
      __darkmode,
      __alt,
      __caption,
      __nodeID,
      __showCaption,
      __sizes,
      __span,
      __height
    } = imfo;
    if (__placeholder) {
      return {
        id: __nodeID,
        relationTo: this.__collection,
        placeholder: true
      };
    } else {
      if (!__src) throw new Error("Image data is missing src");
      const additionalData: Pick<
        UploadedImageBlock,
        OptionalKeys<UploadedImageBlock>
      > = {};
      if (__width) {
        additionalData.width = __width;
      }
      if (__height) {
        additionalData.height = __height;
      }
      if (typeof __showCaption === "boolean") {
        additionalData.showCaption = __showCaption;
      }
      if (__sizes) {
        additionalData.sizes = __sizes;
      }
      return {
        id: __nodeID,
        value: __value,
        darkmode: __darkmode,
        alt: __alt,
        caption: __caption || undefined,
        src: __src,
        span: __span,
        sizes: __sizes || undefined,
        relationTo: this.__collection,
        placeholder: false,
        ...additionalData
      } as RP_ImageData;
    }
  }

  setData(data: RP_ImageData): void {
    const writable = this.getWritable();
    const { relationTo, pending } = data;
    writable.__collection = relationTo;
    writable.__form = pending
      ? {
          ...pending
        }
      : null;

    if (!!data.placeholder) {
      writable.__value = null;
      writable.__src = null;
      writable.__darkmode = false;
      writable.__span = 100;
      writable.__alt = "";
      writable.__caption = null;
      writable.__height = 100;
      writable.__width = 100;
      writable.__sizes = null;
      writable.__showCaption = false;
      writable.__placeholder = true;
      writable.__pending = false;

      return;
    } else if (!!data.pending) {
      writable.__pending = true;
      writable.__form = {
        formID: data.pending.formID,
        src: data.pending.src
      };
      writable.__value = null;
      writable.__src = data.src;
      writable.__darkmode =
        typeof data.darkmode === "boolean" ? data.darkmode : false;
      writable.__span = data.span;
      writable.__alt = data.alt;
      writable.__caption = data.caption;
      writable.__height = data.height || 100;
      writable.__width = data.width || 100;
      writable.__sizes = data.sizes;
      writable.__placeholder = false;
      writable.__showCaption = false;
    } else {
      writable.__value = null;
      writable.__src = null;
      writable.__darkmode = false;
      writable.__span = 100;
      writable.__alt = "";
      writable.__caption = null;
      writable.__height = 100;
      writable.__width = 100;
      writable.__sizes = null;
      writable.__pending = false;
      writable.__showCaption = false;
      writable.__placeholder = true;
    }
  }

  getCaption(): string {
    return this.__caption || "";
  }

  getSpan(): number {
    return this.__span;
  }

  setSpan(span: number) {
    const writeable = this.getWritable();
    writeable.__span = clamp(1, span, 1080);
  }

  override updateDOM(): false {
    return false;
  }
}

export type RPImageDataAgnostic =
  | (Omit<EmptyImageBlock, "id"> & { id?: string })
  | (Omit<UploadedImageBlock, "id"> & { id?: string })
  | (Omit<PendingUploadImageBlock, "id"> & {
      id?: string;
    });

export function $createRPImageServerNode({
  data: dat
}: {
  data: RPImageDataAgnostic;
}): RPImageServerNode {
  if (!dat?.id) {
    dat.id = new ObjectID().toHexString();
  }
  const data = dat as Internal_RPImageData;

  return $applyNodeReplacement(
    new RPImageServerNode({ data: data as RP_ImageData })
  );
}

export function $isRPImageServerNode(
  node: LexicalNode | null | undefined
): node is RPImageServerNode {
  return node instanceof RPImageServerNode;
}
