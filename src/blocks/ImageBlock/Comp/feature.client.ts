"use client";

import {DarkRoomPlugin} from "@/payload/fields/Article/Cover/rp-image/client/plugin";
import {createClientFeature} from "@payloadcms/richtext-lexical/client";

export const RPImageFeatureClient = createClientFeature({
	plugins: [{Component: DarkRoomPlugin, position: "bottom"}]
});
