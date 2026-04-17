import { RP_ImageBlock } from "@/payload/fields/Article/Cover/rp-image/client/component";
import { RP_IMG_DMA } from "@/payload/fields/Article/Cover/rp-image/client/nodeTODomMap";
import { $convertRPImageElement } from "@/payload/fields/Article/Cover/rp-image/server/node/conversions";
import {
  Internal_RPImageData,
  RP_ImageData,
  RPImageDataAgnostic,
  RPImageServerNode,
  SerializedRPImageNode
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {
  $applyNodeReplacement,
  DOMConversionMap,
  EditorConfig,
  LexicalEditor,
  LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import ObjectID from "bson-objectid";
import { JSX } from "react";

export class RP_ImageNode extends RPImageServerNode {
  static override clone(node: RPImageServerNode): RPImageServerNode {
    return super.clone(node);
  }

  static override getType(): string {
    return super.getType();
  }

  static override importDOM(): DOMConversionMap<
    HTMLImageElement | HTMLDivElement
  > {
    return {
      img: (node) => ({
        conversion: (domNode) =>
          $convertRPImageElement(
            domNode as HTMLImageElement,
            $createRPImageNode
          ),
        priority: 0
      }),
      div: (node) => {
        if (
          [RP_IMG_DMA.pending.formID, RP_IMG_DMA.nodeId, RP_IMG_DMA.relationTo]
            .map((key) => RP_IMG_DMA.PREFIX + key)
            .every((r) => node.hasAttribute(r))
        ) {
          return {
            conversion: (domNode) =>
              $convertRPImageElement(
                domNode as HTMLDivElement,
                $createRPImageNode
              ),
            priority: 3
          };
        }
        return null;
      }
    };
  }

  static override importJSON(
    serializedNode: SerializedRPImageNode
  ): RP_ImageNode {
    if (!serializedNode?.id) {
      serializedNode.id = new ObjectID().toHexString();
      serializedNode.version = 3;
    }
    const { id, relationTo, pending } = serializedNode;
    if ("value" in serializedNode) {
      const {
        width,
        height,
        blurDataUrl,
        caption,
        showCaption,
        alt,
        span,
        sizes,
        darkmode
      } = serializedNode;

      const importedData = {
        id,
        relationTo,
        width,
        height,
        blurDataUrl,
        caption,
        showCaption,
        alt,
        span,
        sizes,
        darkmode,
        pending
      } as unknown as Internal_RPImageData<typeof relationTo>;
      const node = $createRPImageNode({ data: importedData });
      node.setFormat(serializedNode.format);

      return node;
    } else {
      const importedData = {
        id,
        relationTo,
        pending
      } as unknown as Internal_RPImageData<typeof relationTo>;
      const node = $createRPImageNode({ data: importedData });
      node.setFormat(serializedNode.format);

      return node;
    }
  }

  override decorate(
    _editor?: LexicalEditor,
    _config?: EditorConfig
  ): JSX.Element {
    const data = this.getData();

    return (
      <RP_ImageBlock
        data={data}
        nodeKey={this.getKey()}
        format={this.__format}
      />
    );
  }

  override exportJSON(): SerializedRPImageNode {
    return super.exportJSON();
  }
}

export function $createRPImageNode({
  data
}: {
  data: RPImageDataAgnostic;
}): RP_ImageNode {
  if (!data?.id) {
    data.id = new ObjectID().toHexString();
  }
  if (!!data.placeholder) {
    return $applyNodeReplacement(
      new RP_ImageNode({
        data: {
          id: data.id,
          pending: false,
          relationTo: data.relationTo,
          placeholder: true
        }
      })
    );
  } else if (!!data.pending) {
    const {
      width,
      showCaption,
      darkmode,
      height,
      sizes,
      src,
      blurDataUrl,
      caption,
      alt,
      id,
      span
    } = data;
    return $applyNodeReplacement(
      new RP_ImageNode({
        data: {
          id,
          width,
          span,
          sizes,
          src,
          blurDataUrl,
          alt,
          caption,
          height,
          showCaption,
          darkmode,
          relationTo: data.relationTo,
          pending: {
            formID: data.pending.formID,
            src: data.pending.src
          },
          placeholder: false
        }
      })
    );
  } else {
    const { id, relationTo, value, ...rest } = data;
    return $applyNodeReplacement(
      new RP_ImageNode({
        data: {
          id,
          relationTo,
          value,
          src: rest.src,
          alt: rest.alt
        } as RP_ImageData
      })
    );
  }
}

export function $isRPImageNode(
  node: LexicalNode | null | undefined
): node is RP_ImageNode {
  return node instanceof RP_ImageNode;
}
