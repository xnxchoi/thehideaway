import {$createRPImageNode} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
	$createRPImageServerNode,
	Internal_RPImageData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {DOMConversionOutput} from "@payloadcms/richtext-lexical/lexical";
import {uuidv7} from "uuidv7";

export function $convertRPImageElement(
	domNode: HTMLImageElement | HTMLDivElement,
	$createNode: typeof $createRPImageNode | typeof $createRPImageServerNode,
): DOMConversionOutput | null {
	if (domNode.hasAttribute("data-estate-pending-image-form-id")) {
		const formID = domNode.getAttribute("data-estate-pending-image-form-id")

		if (formID != null) {
			const node = $createNode({
				data: {
					pending: {
						formID,
						src: domNode.getAttribute("src") || "",
					},
				} as Internal_RPImageData,
			})
			return {node}
		}
	}
	if (
		domNode.hasAttribute("data-estate-image-relation-to") &&
		domNode.hasAttribute("data-estate-image-id")
	) {
		const id = domNode.getAttribute("data-estate-image-id")
		const relationTo = domNode.getAttribute("data-estate-image-relation-to") as ImageCollectionSlug | null

		if (id != null && relationTo != null) {
			const node = $createNode({
				data: {
					src: "",
					alt: "", caption: "", darkmode: false,
					relationTo: relationTo as ImageCollectionSlug,
					id: undefined!,
					value: id,
				}
			})
			return {node}
		}
	}

	// Create pending UploadNode. Auto-Upload functionality will then be handled by the node transform
	const node = $createNode({
		data: {
			pending: {
				formID: uuidv7(),
				src: domNode.getAttribute("src") || "",
			},
		} as Internal_RPImageData,
	})

	return {node}
}