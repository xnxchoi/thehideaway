import {
	$convertRPImageElement
} from "@/payload/fields/Article/Cover/rp-image/server/node/conversions";
import {FetchedImageDoc, RenderImageFields} from "@/types/collections/imageCollections";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {clamp} from "@/utilities/mathUtilities";
import {StronglyTypedLeafNode} from "@payloadcms/richtext-lexical";
import {
	DOMConversionMap,
	DOMExportOutput,
	EditorConfig,
	ElementFormatType,
	LexicalNode,
	NodeKey,
} from "@payloadcms/richtext-lexical/lexical"
import {
	DecoratorBlockNode,
	SerializedDecoratorBlockNode
} from "@payloadcms/richtext-lexical/lexical/react/LexicalDecoratorBlockNode";

import ObjectID from "bson-objectid"
import {$applyNodeReplacement} from "lexical"
import type {JSX} from "react"
import {OptionalKeys} from "ts-essentials";
import {uuidv7} from "uuidv7";

export type PopulatedImageDoc<T extends ImageCollectionSlug> = T extends ImageCollectionSlug ? RenderImageFields : never;
export type RenderImageFieldsWithSource<T extends ImageCollectionSlug = ImageCollectionSlug> = {
	/**
	 * Every lexical node that has sub-fields needs to have a unique ID. This is the ID of this upload node, not the ID of the linked upload document
	 */
	id: string
	relationTo: T
	/**
	 * Value can be just the document ID, or the full, populated document
	 */
	value: string | FetchedImageDoc
	pending?: { formID: string, src?: string }

} & RP_InternalImageNodeData

export type EmptyImageBlock<TX extends ImageCollectionSlug = ImageCollectionSlug> = {
	id: string

	relationTo: TX
	pending: {
		formID: string
		src?: string
	}

}
export type RP_ImageData<T extends ImageCollectionSlug = ImageCollectionSlug> = {
	[TX in ImageCollectionSlug]: (RenderImageFieldsWithSource<TX> | EmptyImageBlock<TX>)
}[T]
export type RP_InternalImageNodeData = {
	src: string;
	width?: number;
	height?: number;
	blurDataUrl?: string;
	caption?: string;
	showCaption?: boolean;
	alt: string;
	span?: number;
	sizes?: string;
	darkmode?: boolean
}
/**
 * Internal use only - UploadData type that can contain a pending state
 * @internal
 */
export type Internal_RPImageData<T extends ImageCollectionSlug = ImageCollectionSlug> =
	{
		pending?: {
			formID: string
			src?: string
		}
	} & RP_ImageData<T>
export type SerializedRPImageNode =
	StronglyTypedLeafNode<SerializedDecoratorBlockNode, "rp-image">
	&
	RP_ImageData

export class RPImageServerNode extends DecoratorBlockNode {
	__collection: ImageCollectionSlug;
	__value?: null | string | FetchedImageDoc;
	__form: {
		formID: string
		src?: string
	} | null = null;
	__showCaption: boolean = false;
	__src: string | null = null;
	__height: number | null = null;
	__width: number | null = null;
	__alt: string = "Photo by ";
	__sizes?: string | null = null;
	__darkmode: boolean = false;
	__caption?: string | null = null;
	__span: number = 640;
	__nodeID: string;

	constructor({
		            data,
		            format,
		            key,
	            }: {
		data: RP_ImageData
		format?: ElementFormatType
		key?: NodeKey
	}) {
		super(format, key)
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
		this.__width = null
		this.__sizes = null;
		this.__form = null;
		if ("value" in data) {
			const {
				src,
				showCaption,
				sizes,
				span,
				alt,
				caption,
				height,
				width,
				darkmode, value
			} = data
			this.__value = value;
			this.__src = src;
			this.__darkmode = darkmode || false;
			span && (this.__span = span);
			this.__alt = alt;
			this.__caption = caption || null;
			this.__height = height || null;
			this.__width = width || null;
			this.__sizes = sizes || null;
			this.__showCaption = showCaption || false;
		}
		if (data.pending) {
			this.__form = data.pending
		}
	}

	static override clone(node: RPImageServerNode): RPImageServerNode {
		return new this({
			data: node.getData(),
			format: node.__format,
			key: node.__key,
		})
	}

	static override getType(): string {
		return "rp-image"
	}

	static override importDOM(): DOMConversionMap<HTMLImageElement> {
		return {
			img: (node) => ({
				conversion: (domNode) => $convertRPImageElement(domNode as HTMLImageElement, $createRPImageServerNode),
				priority: 0,
			}),

		}
	}

	static override importJSON(serializedNode: SerializedRPImageNode): RPImageServerNode {

		if (!serializedNode?.id) {
			serializedNode.id = ObjectID().toHexString()
			serializedNode.version = 3
		}

		const {id, format, relationTo, version, type, pending, ...rest} = serializedNode;
		const e = "value" in rest ? {
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
		} : {}
		const node = $createRPImageServerNode({
			data: {
				pending,
				id, relationTo, ...e
			} as Internal_RPImageData<typeof relationTo>
		})
		node.setFormat(format)
		return node;
		// switch (relationTo) {
		//     case 'assets': {
		//
		//         const importedData: Internal_RPImageData<"assets"> = {
		//             id,
		//             ...r,
		//             data,
		//             relationTo,
		//         }
		//         const node = $createRPImageServerNode({data: importedData})
		//         node.setFormat(serializedNode.format)
		//
		//         return node
		//     }
		//     case 'userMedia': {
		//         const rest = r as RP_ImageNodeDat;
		//         const more = 'formID' in rest ? {formID: rest.formID} : 'pending' in rest ? {pending: rest?.pending} : {};
		//         const importedData: Internal_RPImageData<"userMedia"> = {
		//             id: serializedNode.id,
		//
		//             ...more,
		//             relationTo: serializedNode.relationTo,
		//             value: serializedNode.value,
		//         }
		//         const node = $createRPImageServerNode({data: importedData})
		//         node.setFormat(serializedNode.format)
		//         return node
		//     }
		//     case 'exMedia': {
		//         const exNode = serializedNode as Omit<SerializedRPImageNode, 'fields'> & {
		//             fields: RenderImageFieldsWithSource<'exMedia'>
		//         }
		//         const rest = r as RP_ImageNodeDat;
		//         const more = 'formID' in rest ? {formID: rest.formID} : 'pending' in rest ? {pending: rest?.pending} : {};
		//         const importedData: Internal_RPImageData<"exMedia"> = {
		//             id: serializedNode.id,
		//             fields: exNode.fields,
		//             ...more,
		//             relationTo: serializedNode.relationTo,
		//             value: serializedNode.value,
		//         }
		//         const node = $createRPImageServerNode({data: importedData})
		//         node.setFormat(serializedNode.format)
		//         return node
		//     }
		// }
	}

	static isInline(): false {
		return false
	}

	override createDOM(config?: EditorConfig): HTMLElement {
		const element = document.createElement("div")

		return element
	}

	override decorate(): JSX.Element {
		return null as unknown as JSX.Element
	}

	override exportDOM(): DOMExportOutput {
		const elemen
			= document.createElement(this.__src ? "img" : "div")
		if (this.__src) {
			const element = elemen as HTMLImageElement;
			const relationTo = this.__collection;
			const value = this.__value as string;
			element.setAttribute("data-estate-image-id", String(value))
			element.setAttribute("data-estate-image-relation-to", relationTo)
			return {element}
		} else {
			const element = elemen as HTMLDivElement;
		}
		const pending = this.__form;
		!!pending && elemen.setAttribute("data-estate-pending-image-form-id", String(pending.formID))
		const src = pending?.src || false;
		src && elemen.setAttribute("data-estate-pending-image-form-src", src)
		return {element: elemen}
	}

	override exportJSON(): SerializedRPImageNode {
		return {
			...super.exportJSON(),
			...this.getData(),
			type: "rp-image",
			version: 3,
		}
	}

	getData(): RP_ImageData {
		const imfo = this.getLatest();
		const {
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
			__height,
		} = imfo;
		const base: Pick<RP_ImageData, "id" | "relationTo" | "pending"> = {
			id: __nodeID,

			relationTo: this.__collection,
		}
		if (__form) {
			base.pending = {
				...__form
			}
		}
		if (__value) {
			//this is inserted
			if (!__src) throw new Error("Image data is missing src")
			const additionalData: Pick<RenderImageFieldsWithSource, OptionalKeys<RenderImageFieldsWithSource>> = {}
			if (__width) {
				additionalData.width = __width
			}
			if (__height) {
				additionalData.height = __height
			}
			if (typeof __showCaption === "boolean") {
				additionalData.showCaption = __showCaption
			}
			if (__sizes) {
				additionalData.sizes = __sizes
			}
			return {
				...base,
				...additionalData,
				value: __value,
				darkmode: __darkmode,
				alt: __alt,
				caption: __caption || undefined,
				src: __src,
				span: __span,
				sizes: __sizes || undefined,
			} as RP_ImageData
		} else {
			return {
				...base,

			} as RP_ImageData
		}
	}

	setData(data: RP_ImageData): void {
		const writable = this.getWritable()
		const {relationTo, pending,} = data;
		writable.__collection = relationTo;
		writable.__form = pending ? {
			...pending,
		} : null
		if ("value" in data) {
			writable.__value = data.value;
			writable.__src = data.src;
			writable.__darkmode = data.darkmode || false;
			writable.__span = data.span || 100;
			writable.__alt = data.alt || "Photo by";
			writable.__caption = data.caption || "";
			writable.__height = data.height || 100;
			writable.__width = data.width || 100;
			writable.__sizes = data.sizes || "";
			writable.__showCaption = typeof data.showCaption === "boolean" ? data.showCaption : Boolean(data.caption);
		} else {
			writable.__value = null;
			writable.__src = null;
			writable.__darkmode = false;
			writable.__span = 100;
			writable.__alt = "Photo by";
			writable.__caption = null;
			writable.__height = 100;
			writable.__width = 100;
			writable.__sizes = null
			writable.__showCaption = false;

		}
	}

	getCaption(): string {
		return this.__caption || ""
	}

	getSpan(): number {
		return this.__span
	}

	setSpan(span: number) {
		const writeable = this.getWritable();
		writeable.__span = clamp(1, span, 1080);
	}

	override updateDOM(): false {
		return false
	}
}

export type RPImageDataAgnostic =
	Omit<EmptyImageBlock, "id"> & { id?: string }
	| Omit<RenderImageFieldsWithSource, "id"> & { id?: string }

export function $createRPImageServerNode({
	                                         data: dat,
                                         }: {
	data: RPImageDataAgnostic
}): RPImageServerNode {
	if (!dat?.id) {
		dat.id = new ObjectID().toHexString()
	}
	const data = (dat as Internal_RPImageData);
	if (!("value" in dat)) {

		data.pending = {
			...data.pending,
			formID: data.pending?.formID || uuidv7(),
		}
	}
	return $applyNodeReplacement(new RPImageServerNode({data: data as RP_ImageData}))
}

export function $isRPImageServerNode(
	node: LexicalNode | null | undefined,
): node is RPImageServerNode {
	return node instanceof RPImageServerNode
}