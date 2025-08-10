'use client'
import {createClientFeature} from '@payloadcms/richtext-lexical/client'
import {StickyHeadingNode} from '@/payload/Lexical/Features/StickyHeading'
import {RestrictFirstNodePlugin} from '@/payload/Lexical/Features/RestrictRemovalPlugin'

export const ClientSideTitle = createClientFeature({
	nodes: [StickyHeadingNode],
	plugins: [
		{
			Component: RestrictFirstNodePlugin,
			position: 'aboveContainer',
		},
	],
})
