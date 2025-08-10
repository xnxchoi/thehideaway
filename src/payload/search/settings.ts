import {FrontEndCollections} from "@/stores/Routing/RP_Voyageur";
import {CollectionConfig} from "payload";

export type MetaCollections = Exclude<FrontEndCollections, "search">;

export const metaCollections: CollectionConfig[] = [
	{
		slug: "posts",
		labels: {
			singular: "Post",
			plural: "Posts",
		},
		fields: [
			{
				name: "meta",
				type: "group",
				fields: [
					{
						name: "title",
						type: "text",
					},
					{
						name: "description",
						type: "text",
					},
					{
						name: "image",
						type: "upload",
						relationTo: "media",
					},
				],
			},
		],
	},
];
