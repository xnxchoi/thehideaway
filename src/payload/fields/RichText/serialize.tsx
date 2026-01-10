import {CallToActionBlock} from "@/blocks/CallToAction/Component";

import {CodeBlock} from "@/blocks/Code/Component";
import {PostedImage} from "@/blocks/ImageBlock/Component";
import {ReferencedLink} from "@/components/UX/Link/referencedLink";
import type {
	CallToActionBlock as CTABlockProps,
	CodeBlock as CodeBlockProps,
	Media1 as MediaBlockProps
} from "@/payload-types";
import type {DefaultNodeTypes, SerializedBlockNode} from "@payloadcms/richtext-lexical";
import type {JSX} from "react";
import React, {Fragment} from "react";

import {
	IS_BOLD,
	IS_CODE,
	IS_ITALIC,
	IS_STRIKETHROUGH,
	IS_SUBSCRIPT,
	IS_SUPERSCRIPT,
	IS_UNDERLINE
} from "./nodeFormat";

export type NodeTypes =
	| DefaultNodeTypes
	| SerializedBlockNode<CTABlockProps | MediaBlockProps | CodeBlockProps>;

type Props = {
	nodes: NodeTypes[];
};

export function serializeLexical({nodes}: Props): JSX.Element {
	return (
		<>
			{nodes?.map((node, index): JSX.Element | null => {
				if (node == null) {
					return null;
				}

				if (node.type === "text") {
					let text = <React.Fragment key={index}>{node.text}</React.Fragment>;
					if (node.format & IS_BOLD) {
						text = (
							<strong data-themed="color" key={index}>
								{text}
							</strong>
						);
					}
					if (node.format & IS_ITALIC) {
						text = (
							<em data-themed="color" key={index}>
								{text}
							</em>
						);
					}
					if (node.format & IS_STRIKETHROUGH) {
						text = (
							<span
								data-themed="color"
								key={index}
								style={{textDecoration: "line-through"}}
							>
                {text}
              </span>
						);
					}
					if (node.format & IS_UNDERLINE) {
						text = (
							<span
								data-themed="color"
								key={index}
								style={{textDecoration: "underline"}}
							>
                {text}
              </span>
						);
					}
					if (node.format & IS_CODE) {
						text = (
							<code data-themed="color" className={"font-mono"} key={index}>
								{node.text}
							</code>
						);
					}
					if (node.format & IS_SUBSCRIPT) {
						text = (
							<sub data-themed="color" key={index}>
								{text}
							</sub>
						);
					}
					if (node.format & IS_SUPERSCRIPT) {
						text = (
							<sup data-themed="color" key={index}>
								{text}
							</sup>
						);
					}

					return text;
				}

				// NOTE: Hacky fix for
				// https://github.com/facebook/lexical/blob/d10c4e6e55261b2fdd7d1845aed46151d0f06a8c/packages/lexical-list/src/LexicalListItemNode.ts#L133
				// which does not return checked: false (only true - i.e. there is no prop for false)
				const serializedChildrenFn = (node: NodeTypes): JSX.Element | null => {
					if (!("children" in node)) {
						return null;
					}
					if (node.children == null) {
						return null;
					}
					if (node?.type === "list" && node?.listType === "check") {
						for (const item of node.children) {
							if ("checked" in item) {
								if (!item?.checked) {
									item.checked = false;
								}
							}
						}
					}
					return serializeLexical({nodes: node.children as NodeTypes[]});
				};

				const serializedChildren =
					"children" in node ? serializedChildrenFn(node) : "";

				if (node.type === "block") {
					const block = node.fields;

					const blockType = block?.blockType;

					if (!block || !blockType) {
						return null;
					}

					switch (blockType) {
						case "cta":
							return (
								<CallToActionBlock
									data-themed="background-color, color"
									key={index}
									{...block}
								/>
							);
						case "image":
							return <PostedImage {...block} />;
						// case "banner":
						//   return (
						//     <BannerBlock
						//       className="col-start-2 mb-4"
						//       data-themed="background-color, color"
						//       key={index}
						//       {...block}
						//     />
						//   );
						case "code":
							return (
								<CodeBlock
									className="col-start-2 font-mono"
									data-themed="background-color, color"
									key={index}
									{...block}
								/>
							);
						default:
							return null;
					}
				} else {
					switch (node.type) {
						case "linebreak": {
							return <br className="col-start-2" key={index}/>;
						}
						case "paragraph": {
							return (
								<p
									className="col-start-2"
									data-themed="color"
									data-key={index}
									key={index}
								>
									{serializedChildren}
								</p>
							);
						}
						case "heading": {
							const Tag = node?.tag;
							return (
								<Tag className="col-start-2" data-themed="color" key={index}>
									{serializedChildren}
								</Tag>
							);
						}
						case "list": {
							const Tag = node?.tag;
							return (
								<Tag
									className="list col-start-2"
									data-themed="color"
									key={index}
								>
									{serializedChildren}
								</Tag>
							);
						}
						case "listitem": {
							if (node?.checked != null) {
								return (
									<li
										aria-checked={node.checked ? "true" : "false"}
										// className={` ${node.checked ? '' : ''}`}
										data-themed="color"
										key={index}
										tabIndex={-1}
										value={node?.value}
									>
										{serializedChildren}
									</li>
								);
							}
							return (
								<li data-themed="color" key={index} value={node?.value}>
									{serializedChildren}
								</li>
							);
						}
						case "quote": {
							return (
								<blockquote
									className="col-start-2"
									data-themed="color"
									key={index}
								>
									{serializedChildren}
								</blockquote>
							);
						}
						case "link": {
							const {fields} = node;

							return (
								<ReferencedLink
									data-themed="color"
									key={index}
									link={{
										label: "a link",
										newTab: Boolean(fields?.newTab),
										reference: fields.doc as any,
										type:
											fields.linkType === "internal" ? "reference" : "custom"
									}}
									href={fields.url}
								>
									{serializedChildren}
								</ReferencedLink>
							);
						}

						default:
							return null;
					}
				}
			})}
		</>
	);
}
