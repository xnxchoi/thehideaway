import type {Metadata} from "next";

import type {
	GenerateEditViewMetadata
} from "node_modules/@payloadcms/next/dist/views/Document/getMetaBySegment";

import {generateEditViewMetadata} from "node_modules/@payloadcms/next/dist/views/Edit/metadata";

export const generateLivePreviewViewMetadata: GenerateEditViewMetadata =
	async ({
		collectionConfig,
		config,
		globalConfig,
		i18n,
		isEditing,
	}): Promise<Metadata> =>
		generateEditViewMetadata({
			collectionConfig,
			config,
			globalConfig,
			i18n,
			isEditing,
			view: "livePreview",
		});
