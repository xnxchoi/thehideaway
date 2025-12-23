"use client";

import type {RichTextFieldClient, ClientField} from "payload";

import {
	type BaseClientFeatureProps,
  type FeatureProviderClient,
	type FeatureProviderProviderClient,
  type SanitizedClientEditorConfig
} from "@payloadcms/richtext-lexical";
import { ShimmerEffect, useConfig } from "@payloadcms/ui";
import { lazy, Suspense, useEffect, useMemo, useState, type FC } from "react";

import {loadClientFeatures} from "@/payload/Lexical/defaults/loadClientFeatures";
import {
	AlignFeatureClient,
	BlockquoteFeatureClient,
	BlocksFeatureClient,
	BoldFeatureClient,
	ChecklistFeatureClient,
  defaultEditorLexicalConfig,
	HeadingFeatureClient,
	HorizontalRuleFeatureClient,
	IndentFeatureClient,
	InlineCodeFeatureClient,
	InlineToolbarFeatureClient,
	ItalicFeatureClient,
	LinkFeatureClient,
	OrderedListFeatureClient,
	ParagraphFeatureClient,
	RelationshipFeatureClient,
	sanitizeClientEditorConfig,
	StrikethroughFeatureClient,
	SubscriptFeatureClient,
	SuperscriptFeatureClient,
	UnderlineFeatureClient,
	UnorderedListFeatureClient,
	UploadFeatureClient
} from "@payloadcms/richtext-lexical/client";
import type { LexicalRichTextFieldProps } from "node_modules/@payloadcms/richtext-lexical/dist/types";
import type {FeatureClientSchemaMap} from "@/payload/Lexical/defaults/types";
import {ContentHandOffClientFeature} from "@/payload/Lexical/Features/HandOff/feature.client";
import {RichLexicalField} from "./RichLexical";
import type {RichTextFieldProps} from "./content";

export const RichTextField = (props: LexicalRichTextFieldProps) => {
	const {field, path, schemaPath} = props;
	const clientFeatures = useMemo(
		(): {
			[featureKey: string]: {
				clientFeatureProps?: BaseClientFeatureProps<Record<string, any>>;
				clientFeatureProvider?: FeatureProviderProviderClient<any, any>;
			};
		} => ({
			contentHandOffFeature: {
				clientFeatureProps: {
					featureKey: "contentHandOffFeature",
					order: 0
				},
				clientFeatureProvider: ContentHandOffClientFeature
			},
			link: {
				clientFeatureProps: {
					defaultLinkType: "custom",
					defaultLinkURL: "https://",
					enabledCollections: ["pages", "posts", "delta"],
					featureKey: "link",
					order: 1
				},
				clientFeatureProvider: LinkFeatureClient
			},
			horizontalRule: {
				clientFeatureProps: {
					featureKey: "horizontalRule",
					order: 2
				},
				clientFeatureProvider: HorizontalRuleFeatureClient
			},
			toolbarInline: {
				clientFeatureProps: {
					featureKey: "toolbarInline",
					order: 3
				},
				clientFeatureProvider: InlineToolbarFeatureClient
			},
			blocks: {
				clientFeatureProps: {
					featureKey: "blocks",
					order: 4
				},
				clientFeatureProvider: BlocksFeatureClient
			},
			relationship: {
				clientFeatureProps: {
					enabledCollections: [
						"posts",
						"delta",
						"users",
						"albums",
						"tracks",
						"pages"
					],
					featureKey: "relationship",
					order: 5
				},
				clientFeatureProvider: RelationshipFeatureClient
			},
			heading: {
				clientFeatureProps: {
					featureKey: "heading",
					order: 6
				},
				clientFeatureProvider: HeadingFeatureClient
			},
			bold: {
				clientFeatureProps: {
					featureKey: "bold",
					order: 7
				},
				clientFeatureProvider: BoldFeatureClient
			},
			italic: {
				clientFeatureProps: {
					featureKey: "italic",
					order: 8
				},
				clientFeatureProvider: ItalicFeatureClient
			},
			underline: {
				clientFeatureProps: {
					featureKey: "underline",
					order: 9
				},
				clientFeatureProvider: UnderlineFeatureClient
			},
			subscript: {
				clientFeatureProps: {
					featureKey: "subscript",
					order: 11
				},
				clientFeatureProvider: SubscriptFeatureClient
			},
			superscript: {
				clientFeatureProps: {
					featureKey: "superscript",
					order: 12
				},
				clientFeatureProvider: SuperscriptFeatureClient
			},
			paragraph: {
				clientFeatureProps: {
					featureKey: "paragraph",
					order: 14
				},
				clientFeatureProvider: ParagraphFeatureClient
			},
			indent: {
				clientFeatureProps: {
					featureKey: "indent",
					order: 16
				},
				clientFeatureProvider: IndentFeatureClient
			},
			align: {
				clientFeatureProps: {
					featureKey: "align",
					order: 17
				},
				clientFeatureProvider: AlignFeatureClient
			},
			unorderedList: {
				clientFeatureProps: {
					featureKey: "unorderedList",
					order: 17
				},
				clientFeatureProvider: UnorderedListFeatureClient
			},
			inlineCode: {
				clientFeatureProps: {
					featureKey: "inlineCode",
					order: 18
				},
				clientFeatureProvider: InlineCodeFeatureClient
			},
			orderedList: {
				clientFeatureProps: {
					featureKey: "orderedList",
					order: 18
				},
				clientFeatureProvider: OrderedListFeatureClient
			},
			strikethrough: {
				clientFeatureProps: {
					featureKey: "strikethrough",
					order: 19
				},
				clientFeatureProvider: StrikethroughFeatureClient
			},
			checklist: {
				clientFeatureProps: {
					featureKey: "checklist",
					order: 19
				},
				clientFeatureProvider: ChecklistFeatureClient
			},
			blockquote: {
				clientFeatureProps: {
					featureKey: "blockquote",
					order: 20
				},
				clientFeatureProvider: BlockquoteFeatureClient
			},
			upload: {
				clientFeatureProps: {
					collections: {},
					featureKey: "upload",
					order: 21
				},
				clientFeatureProvider: UploadFeatureClient
			}
		}),
		[]
	);
	const featureClientSchemaMap = useMemo((): FeatureClientSchemaMap => {
		return {
			// Blocks feature schema map - contains field schemas for each block type
			link: {
				[`${schemaPath}.lexical_internal_feature.link.fields.text`]: [
					{
						name: "text",
						type: "text",
						label: "Text to display",
						required: true,
						admin: {}
					}
				],
				[`${schemaPath}.lexical_internal_feature.link.fields.linkType`]: [
					{
						name: "linkType",
						type: "radio",
						label: "Link Type",
						required: true,
						options: [
							{
								label: "Custom URL",
								value: "custom"
							},
							{
								label: "Internal Link",
								value: "internal"
							}
						]
					}
				],
				[`${schemaPath}.lexical_internal_feature.link.fields.doc`]: [
					{
						name: "doc",

						type: "relationship",
						label: "Choose a document to link to",
						relationTo: ["pages", "posts", "delta"],
						required: true
					}
				],
				[`${schemaPath}.lexical_internal_feature.link.fields.newTab`]: [
					{
						name: "newTab",
						type: "checkbox",
						label: "Open in new tab",
						admin: {}
					}
				],
				[`${schemaPath}.lexical_internal_feature.link.fields.url`]: [
					{
						name: "url",
						type: "text",

						label: "Enter a URL",
						required: true
					}
				],
				[`${schemaPath}.lexical_internal_feature.link.fields`]: [
					{
						name: "text",
						type: "text",
						label: "Text to display",
						required: true,
						admin: {}
					},
					{
						name: "linkType",
						type: "radio",
						label: "Link Type",
						required: true,
						options: [
							{
								label: "Custom URL",
								value: "custom"
							},
							{
								label: "Internal Link",
								value: "internal"
							}
						]
					},
					{
						name: "doc",
						admin: {},
						type: "relationship",
						label: "Choose a document to link to",
						relationTo: ["pages", "posts", "delta"],
						required: true
					},
					{
						name: "newTab",
						type: "checkbox",
						label: "Open in new tab",
						admin: {}
					},
					{
						name: "url",
						type: "text",

						label: "Enter a URL",
						required: true
					}
				]
			},
			blocks: {
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code.fields.id`]:
					[
						{
							name: "id",
							type: "text",
							admin: {
								hidden: true
							},
							label: "ID"
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code.fields.language`]:
					[
						{
							name: "language",
							type: "select",
							label: "Language",
							options: [
								{
									label: "Typescript",
									value: "typescript"
								},
								{
									label: "Javascript",
									value: "javascript"
								},
								{
									label: "CSS",
									value: "css"
								}
							]
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code.fields.code`]:
					[
						{
							name: "code",
							type: "code",
							required: true,
							admin: {}
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code.fields.blockName`]:
					[
						{
							name: "blockName",
							type: "text",
							admin: {
								disabled: true
							},
							label: "Block Name",
							required: false
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code.fields`]:
					[
						{
							name: "id",
							type: "text",
							required: true,
							admin: {
								hidden: true
							},
							label: "Id"
						},
						{
							name: "language",
							type: "select",
							label: "Language",
							options: [
								{
									label: "Typescript",
									value: "typescript"
								},
								{
									label: "Javascript",
									value: "javascript"
								},
								{
									label: "CSS",
									value: "css"
								}
							]
						},
						{
							name: "code",
							type: "code",
							required: true,
							admin: {}
						},
						{
							name: "id",
							type: "text",
							admin: {
								hidden: true
							},
							label: "ID"
						},
						{
							name: "blockName",
							type: "text",
							admin: {
								disabled: true
							},
							label: "Block Name",
							required: false
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.code`]: [
					{
						name: "lexical_blocks_code",
						type: "blocks",
						blocks: [
							{
								slug: "code",
								fields: [
									{
										name: "id",
										type: "text",
										required: true,
										admin: {
											hidden: true
										},
										label: "Id"
									},
									{
										name: "language",
										type: "select",
										label: "Language",

										options: [
											{
												label: "Typescript",
												value: "typescript"
											},
											{
												label: "Javascript",
												value: "javascript"
											},
											{
												label: "CSS",
												value: "css"
											}
										]
									},
									{
										name: "code",
										type: "code",
										required: true,
										admin: {}
									},
									{
										name: "id",
										type: "text",
										admin: {
											hidden: true
										},
										label: "ID"
									},
									{
										name: "blockName",
										type: "text",
										admin: {
											disabled: true
										},
										label: "Block Name",
										required: false
									}
								],
								labels: {
									singular: "Code",
									plural: "Codes"
								}
							}
						]
					}
				],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.mediaBlock.fields.id`]:
					[
						{
							name: "id",
							type: "text",
							admin: {
								hidden: true
							},
							label: "ID"
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.mediaBlock.fields.media`]:
					[
						{
							name: "media",
							type: "upload",
							relationTo: "media",
							required: true,
							label: "Media",
							admin: {
								sortOptions: {
									isSortable: true
								}
							}
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.mediaBlock.fields.blockName`]:
					[
						{
							name: "blockName",
							type: "text",
							admin: {
								disabled: true
							},
							label: "Block Name",
							required: false
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.mediaBlock.fields`]:
					[
						{
							name: "id",
							type: "text",
							required: true,
							admin: {
								hidden: true
							},
							label: "Id"
						},
						{
							name: "media",
							type: "upload",
							relationTo: "media",
							required: true,
							label: "Media",
							admin: {
								sortOptions: {
									isSortable: true
								}
							}
						},
						{
							name: "id",
							type: "text",
							admin: {
								hidden: true
							},
							label: "ID"
						},
						{
							name: "blockName",
							type: "text",
							admin: {
								disabled: true
							},
							label: "Block Name",
							required: false
						}
					],
				[`${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.mediaBlock`]:
					[
						{
							name: "lexical_blocks_mediaBlock",
							type: "blocks",
							blocks: [
								{
									slug: "mediaBlock",
									fields: [
										{
											name: "id",
											type: "text",
											required: true,
											admin: {
												hidden: true
											},
											label: "Id"
										},
										{
											name: "media",
											type: "upload",
											relationTo: "media",
											required: true,
											label: "Media",
											admin: {
												sortOptions: {
													isSortable: true
												}
											}
										},
										{
											name: "id",
											type: "text",
											admin: {
												hidden: true
											},
											label: "ID"
										},
										{
											name: "blockName",
											type: "text",
											admin: {
												disabled: true
											},
											label: "Block Name",
											required: false
										}
									],
									labels: {
										singular: "Media Block",
										plural: "Media Blocks"
									}
								}
							]
						}
					]
			},
			upload: {}
		};
	}, [schemaPath]);
  return (
	  <div>
		  <RichLexicalField
			  path={path}
			  schemaPath={schemaPath}
			  admin={{hideGutter: true}}
			  permissions={true}
			  clientFeatures={clientFeatures}
			  featureClientSchemaMap={
				  featureClientSchemaMap as RichTextFieldProps["featureClientSchemaMap"]
			  }
			  lexicalEditorConfig={props.lexicalEditorConfig}
			  initialLexicalFormState={props.initialLexicalFormState}
			  field={field}
		  />
	  </div>
  );
};
