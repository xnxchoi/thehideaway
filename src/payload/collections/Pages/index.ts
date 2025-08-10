import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField,
} from "@payloadcms/plugin-seo/fields";
import type {CollectionConfig} from "payload";

import {slugField} from "@/payload/fields/slug";
import {hero} from "@/payload/blocks/heros/config";
import {getServerSideURL} from "@/utilities/getURL";
import {Archive} from "@/payload/blocks/ArchiveBlock/config";
import {CallToAction} from "@/payload/blocks/CallToAction/config";
import {Content} from "@/payload/blocks/Content/config";
import {MediaBlock} from "@/payload/blocks/MediaBlock/config";
import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import {generatePreviewPath} from "@/utilities/generatePreviewPath";
import {revalidateDelete, revalidatePage} from "./hooks/revalidatePage";
import {FOTD} from "@/payload/blocks/FOTD/config";
import {HeroSquare} from "@/payload/blocks/HeroSquareBlock/config";
import {pagesAccess} from "@/payload/plugins/locker/access";

export const Pages: CollectionConfig<"pages"> = {
	slug: "pages",
	access: pagesAccess, // This config controls what's populated by default when a page is referenced
	// https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
	// Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pagess'>
	defaultPopulate: {
		title: true,
		slug: true,
		_status: true,
		meta: {
			image: true,
		},
	},
	admin: {
		defaultColumns: ["title", "slug", "updatedAt"],

		livePreview: {
			url: ({data, req}) => {
				const path = generatePreviewPath({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "pages",
					req,
				});

				return `${getServerSideURL()}${path}`;
			},
		},
		preview: (doc, {req}) => {
			const path = generatePreviewPath({
				slug: typeof doc?.slug === "string" ? doc.slug : "",
				collection: "pages",
				req,
			});

			return `${getServerSideURL()}${path}`;
		},
		useAsTitle: "title",
		hidden: ({user}) => {
			if (!user) return true;
			if (user?.role === "admin") return false;
			return true;
		},
		components: {},
	},
	fields: [
		{
			name: "title",
			type: "text",

			required: true,
			index: true,
		},
		{
			type: "tabs",
			admin: {},
			tabs: [
				{
					fields: [hero],
					label: "Hero",
				},
				{
					fields: [
						{
							name: "layout",
							type: "blocks",
							blocks: [
								CallToAction,
								Content,
								MediaBlock,
								Archive,
								FOTD,
								HeroSquare,
							],
						},
					],
					label: "Content",
				},
				{
					name: "pageLayout",
					label: "Layout",
					fields: [
						{
							name: "footerType",
							type: "select",
							options: ["standard", "linksOnly", "hidden"],
							defaultValue: "standard",
							label: "Footer Type",
							admin: {
								condition: (data, siblingData) => {
									return !Boolean(data?.["disableFooter"]?.value);
								},
							},

							index: true,
						},
					],
				},
				{
					name: "meta",
					label: "SEO",
					fields: [
						OverviewField({
							titlePath: "meta.title",
							descriptionPath: "meta.description",
							imagePath: "meta.image",
						}),
						MetaTitleField({
							hasGenerateFn: true,
						}),
						MetaImageField({
							relationTo: "media",
						}),

						MetaDescriptionField({}),
						PreviewField({
							// if the `generateUrl` function is configured
							hasGenerateFn: true,

							// field paths to match the target field for data
							titlePath: "meta.title",
							descriptionPath: "meta.description",
						}),
					],
				},
			],
		},
		{
			name: "publishedAt",
			type: "date",
			admin: {
				position: "sidebar",
			},
		},
		...slugField("title", {slugOverrides: {required: true}}),
	],
	hooks: {
		afterChange: [revalidatePage],
		beforeChange: [populatePublishedAt],
		afterDelete: [revalidateDelete],
	},
	versions: {
		drafts: {
			autosave: {
				interval: 100, // We set this interval for optimal live preview
			},
		},
		maxPerDoc: 50,
	},
};
