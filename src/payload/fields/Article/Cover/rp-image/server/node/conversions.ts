import {$createRPImageNode} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {RP_IMG_DMA} from "@/payload/fields/Article/Cover/rp-image/client/nodeTODomMap";
import {
	$createRPImageServerNode
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {ImageCollectionSlug} from "@/types/collections/image-collections";
import {DOMConversionOutput} from "@payloadcms/richtext-lexical/lexical";
import {uuidv7} from "uuidv7";

export function $convertRPImageElement(
	domNode: HTMLImageElement | HTMLDivElement,
	$createNode: typeof $createRPImageNode | typeof $createRPImageServerNode,
): DOMConversionOutput | null {
	const relTo = domNode.getAttribute(RP_IMG_DMA.PREFIX+RP_IMG_DMA.relationTo) as ImageCollectionSlug | null;
	if (domNode.tagName === "DIV") {
		const node = $createNode({
			data: {
				id: domNode.getAttribute("data-estate-node-id") || uuidv7(),
				placeholder: true,
				relationTo: (relTo || "assets")

			}
		})
		return {node};
	} else {
		const dn = domNode as HTMLImageElement
		const src = dn.src;
		const width = dn.naturalWidth;
		const height = dn.naturalHeight;
		const spanw=parseInt(domNode.getAttribute('data-estate-image-span')||"",10);

		const node = $createNode({
			data: {
				id: domNode.getAttribute("data-estate-node-id") || uuidv7(),
				relationTo: relTo || "userMedia",
				pending: {
					formID: domNode.getAttribute("data-estate-pending-image-form-id") || uuidv7(),
					src,
				}, src, alt: domNode.getAttribute("data-estate-image-alt") || "",span:spanw,
				width,
				height
			}
		})
		return {node}

	}
}

/**
 * if (domNode.hasAttribute("data-estate-pending-image-form-id")) {
 * 		const formID = domNode.getAttribute("data-estate-pending-image-form-id")
 *
 * 		if (formID != null) {
 * 			const node = $createNode({
 * 				data: {
 * 					pending: {
 * 						formID,
 * 						src: domNode.getAttribute("src") || "",
 * 					},
 * 				} as Internal_RPImageData,
 * 			})
 * 			return {node}
 * 		}
 * 	}
 * 	if (
 * 		domNode.hasAttribute("data-estate-image-relation-to") &&
 * 		domNode.hasAttribute("data-estate-image-id")
 * 	) {
 * 		const id = domNode.getAttribute("data-estate-image-id")
 * 		const relationTo = domNode.getAttribute("data-estate-image-relation-to") as ImageCollectionSlug | null
 *
 * 		if (id != null && relationTo != null) {
 *
 * 			const node = $createNode({
 * 				data: {
 * 					relationTo,
 * 					value:id,
 *
 *
 * 				}
 * 			})
 * 			return {node}
 * 		}
 * 	}
 *
 * 	// Create pending UploadNode. Auto-Upload functionality will then be handled by the node transform
 * 	const node = $createNode({
 * 		data: {
 * 			pending: {
 * 				formID: uuidv7(),
 * 				src: domNode.getAttribute("src") || "",
 * 			},
 * 		} as Internal_RPImageData,
 * 	})
 *
 * 	return {node}
 */