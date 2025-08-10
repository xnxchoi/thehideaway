import {
	convertLexicalNodesToHTML,
	createNode,
	createServerFeature,
} from '@payloadcms/richtext-lexical'
import {StickyHeadingNode} from '@/payload/Lexical/Features/StickyHeading'

export const TitleFeature = createServerFeature({
	feature: () => {
		return {
			ClientFeature: '@/payload/Lexical/Features/ClientSideTitle#ClientSideTitle',

			nodes: [
				createNode({
					converters: {
						html: {
							converter: async ({
								converters,
								currentDepth,
								depth,
								draft,
								node,
								overrideAccess,
								parent,
								req,
								showHiddenFields,
							}) => {
								const childrenText = await convertLexicalNodesToHTML({
									converters,
									currentDepth,
									depth,
									draft,
									lexicalNodes: node.children,
									overrideAccess,
									parent: {
										...node,
										parent,
									},
									req,
									showHiddenFields,
								})
								const style = [
									node.format ? `text-align: ${node.format};` : '',
									node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
								].filter(Boolean).join(' ')
								return `<${node?.tag}${style ? ` style='${style}'` : ''}>${childrenText}</${node?.tag}>`
							},
							nodeTypes: [StickyHeadingNode.getType()],
						},
					},
					node: StickyHeadingNode,
				}),
			],
		}
	},
	key: 'titleFeature',
})
