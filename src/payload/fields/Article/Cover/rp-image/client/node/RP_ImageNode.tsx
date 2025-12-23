import {
	RP_ImageBlock,
	RP_InsertImagePlaceholder
} from "@/payload/fields/Article/Cover/rp-image/client/component";
import {
	$convertRPImageElement
} from "@/payload/fields/Article/Cover/rp-image/server/node/conversions";
import {
	Internal_RPImageData,
	RenderImageFieldsWithSource,
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
import {JSX} from "react";
import {uuidv7} from "uuidv7";

export class RP_ImageNode extends RPImageServerNode {
	static override clone(node: RPImageServerNode): RPImageServerNode {
		return super.clone(node)
	}

	static override getType(): string {
		return super.getType()
	}

	static override importDOM(): DOMConversionMap<HTMLImageElement | HTMLDivElement> {
		return {
			img: (node) => ({
				conversion: (domNode) => $convertRPImageElement(domNode as HTMLImageElement, $createRPImageNode),
				priority: 0,
			}),
			div: (node) => {
				if (node.hasAttribute("data-estate-pending-image-form-id") && node.hasAttribute("data-estate-image-relation-to")) {
					return {
						conversion: (domNode) => $convertRPImageElement(domNode as HTMLDivElement, $createRPImageNode),
						priority: 3,
					}
				}
				return null;
			}

		}
	}

	static override importJSON(serializedNode: SerializedRPImageNode): RP_ImageNode {
		if (!serializedNode?.id) {
			serializedNode.id = new ObjectID().toHexString()
			serializedNode.version = 3
		}
		const {id, relationTo, pending} = serializedNode;
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
			} as unknown as Internal_RPImageData<typeof relationTo>
			const node = $createRPImageNode({data: importedData})
			node.setFormat(serializedNode.format)

			return node
		} else {
			const importedData = {
				id,
				relationTo, pending
			} as unknown as Internal_RPImageData<typeof relationTo>
			const node = $createRPImageNode({data: importedData})
			node.setFormat(serializedNode.format)

			return node
		}
		// switch(serializedNode.relationTo){
		//     case 'assets':{
		//         importedData  = {
		//             id: serializedNode.id,
		//
		//             fields: serializedNode.fields,
		//             pending: (serializedNode as Internal_RPImageData).pending,
		//             relationTo: serializedNode.relationTo,
		//             value: serializedNode.value,
		//         }
		//     }
		//     break;
		//     case 'userMedia':{
		//         importedData={
		//             ...serializedNode
		//         }
		//     }
		//     break;
		//     case 'exMedia':{
		//          importedData={
		//             ...serializedNode
		//
		//          }
		//     }
		// }
		//

	}

	override decorate(_editor?: LexicalEditor, _config?: EditorConfig): JSX.Element {
		const data = this.getData();
		if ("value" in data) {
			const {
				id,
				value,
				relationTo,
				...meta
			} = data as RenderImageFieldsWithSource<typeof data.relationTo>;
			const valueId = typeof value === "string" ? value : value.id;
			return (<RP_ImageBlock data={{
					relationTo,
					value: valueId,
					id
					, ...meta,
				}} nodeKey={this.getKey()} format={this.__format}/>
			)
		}
		return <RP_InsertImagePlaceholder data={data} formID={data.pending.formID}
		                                  nodeKey={this.getKey()}/>

	}

	override exportJSON(): SerializedRPImageNode {
		return super.exportJSON()
	}
}

export function $createRPImageNode({
	                                   data,
                                   }: {
	data: RPImageDataAgnostic
}): RP_ImageNode {
	if (!data?.id) {
		data.id = new ObjectID().toHexString()
	}
	if (!("value" in data)) {

		data.pending = {
			...data.pending,
			formID: data.pending?.formID || uuidv7(),
		}
	}
	return $applyNodeReplacement(new RP_ImageNode({data: data as RP_ImageData}))
}

export function $isRPImageNode(node: LexicalNode | null | undefined): node is RP_ImageNode {
	return node instanceof RP_ImageNode
}