import {MediaBlock} from "@/payload/blocks/MediaBlock/Component";
import {
	DefaultNodeTypes,
	type DefaultTypedEditorState,
	SerializedBlockNode,
	SerializedLinkNode,
	SerializedTextNode,
} from "@payloadcms/richtext-lexical";
import {
	JSXConvertersFunction,
	RichText as ConvertRichText,
} from "@payloadcms/richtext-lexical/react";

import {
	CodeBlock,
	Props as CodeBlockProps,
} from "@/payload/blocks/Code/Component";

import type {
	BannerBlock as BannerBlockProps,
	CallToActionBlock as CTABlockProps,
	MediaBlock as MediaBlockProps,
} from "@/payload-types";
import {BannerBlock} from "@/payload/blocks/Banner/Component";
import {CallToActionBlock} from "@/payload/blocks/CallToAction/Component";
import {cn} from "@/lib/utils";
import {CollectionSlug} from "payload";
import React, {ComponentPropsWithoutRef} from "react";
import {createId} from "@paralleldrive/cuid2";
import {Link} from "@/components/UX/Link";
import {
	IS_BOLD,
	IS_CODE,
	IS_ITALIC,
	IS_STRIKETHROUGH,
	IS_SUBSCRIPT,
	IS_SUPERSCRIPT,
	IS_UNDERLINE,
} from "./nodeFormat";
import {md5} from "hash-wasm";
import {nanoid} from "nanoid";

type NodeTypes =
	| DefaultNodeTypes
	| SerializedBlockNode<
	CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps
>;

const internalDocToHref = ({linkNode}: { linkNode: SerializedLinkNode }) => {
	const {value, relationTo} = linkNode.fields.doc!;
	if (typeof value !== "object") {
		throw new Error("Expected value to be an object");
	}
	const slug = value.slug;
	return relationTo === "pages" ? `/${slug}` : `/${relationTo}/${slug}`;
};

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({
	defaultConverters,
}) => ({
	...defaultConverters,
	autolink: ({node, nodesToJSX}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		const rel: string | undefined = node.fields.newTab
			? "noopener noreferrer"
			: undefined;
		const target: string | undefined = node.fields.newTab
			? "_blank"
			: undefined;

		return node.fields.url ? (
			<Link className={"underline underline-offset-1"} href={node.fields.url}
			      {...{rel, target}}
			>
				{children}
			</Link>
		) : (
			<span className={"underline underline-offset-1"}>{children}</span>
		);
	},
	horizontalrule: ({node, nodesToJSX}) => {
		return <hr className={"my-4"} />;
	},
	link: ({node, nodesToJSX}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		const rel: string | undefined = node.fields.newTab
			? "noopener noreferrer"
			: undefined;
		const target: string | undefined = node.fields.newTab
			? "_blank"
			: undefined;

		let href: string = node.fields.url ?? "";
		if (node.fields.linkType === "internal") {
			if (internalDocToHref) {
				href = internalDocToHref({linkNode: node});
			} else {
				console.error(
					"Lexical => JSX converter: Link converter: found internal link, but internalDocToHref is not provided",
				);
				href = "#"; // fallback
			}
		}

		return (
			<Link data-themed="color" href={href} {...{rel, target}}>
				{children}
			</Link>
		);
	},
	list: ({node, nodesToJSX}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		const NodeTag = node.tag;

		return <NodeTag className={`list-${node?.listType}`}>{children}</NodeTag>;
	},
	listitem: ({node, nodesToJSX, parent}) => {
		const hasSubLists = node.children.some((child) => child.type === "list");

		const children = nodesToJSX({
			nodes: node.children,
		});

		if ("listType" in parent && parent?.listType === "check") {
			const uuid = createId();

			return (
				<li data-themed="color" aria-checked={node.checked ? "true" : "false"}
				    className={`list-item-checkbox${node.checked ? "list-item-checkbox-checked" : "list-item-checkbox-unchecked"}${hasSubLists ? "nestedListItem" : ""}`}
					// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
					role="checkbox" style={{listStyleType: "none"}} tabIndex={-1}
					value={node?.value}>
					{hasSubLists ? (
						children
					) : (
						<>
							<input checked={node.checked} id={uuid} readOnly={true}
							       type="checkbox" />
							<label htmlFor={uuid}>{children}</label>
							<br />
						</>
					)}
				</li>
			);
		} else {
			return (
				<li className={`${hasSubLists ? "nestedListItem" : ""}`}
				    style={hasSubLists ? {listStyleType: "none"} : undefined} value={node?.value}>
					{children}
				</li>
			);
		}
	},
	text: ({node, childIndex}) => {
		let text: React.ReactNode = node.text;

		if (node.format & IS_BOLD) {
			text = <strong data-key={childIndex}>{text}</strong>;
		}
		if (node.format & IS_ITALIC) {
			text = <em data-key={childIndex}>{text}</em>;
		}
		if (node.format & IS_STRIKETHROUGH) {
			text = (
				<span data-themed="color" data-key={childIndex}
				      style={{textDecoration: "line-through"}}>
          {text}
        </span>
			);
		}
		if (node.format & IS_UNDERLINE) {
			text = (
				<span data-themed="color" data-key={childIndex}
				      style={{textDecoration: "underline"}}>
          {text}
        </span>
			);
		}
		if (node.format & IS_CODE) {
			text = <code data-key={childIndex}>{text}</code>;
		}
		if (node.format & IS_SUBSCRIPT) {
			text = <sub data-key={childIndex}>{text}</sub>;
		}
		if (node.format & IS_SUPERSCRIPT) {
			text = <sup data-key={childIndex}>{text}</sup>;
		}

		return text;
	},
	quote: ({node, nodesToJSX, childIndex}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		return <blockquote data-key={childIndex}>{children}</blockquote>;
	},
	heading: ({node, nodesToJSX, childIndex}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		const NodeTag = node.tag;

		return <NodeTag data-key={childIndex}>{children}</NodeTag>;
	},

	paragraph: ({node, nodesToJSX, childIndex}) => {
		const children = nodesToJSX({
			nodes: node.children,
		});

		if (!children?.length) {
			return (
				<p>
					<br />
				</p>
			);
		}
		const walker = (node) => {
			let a = "";
			a += node.children.reduce((prev, next) => {
				return "text" in next
					? prev + next.text
					: "children" in next
						? prev + walker(next)
						: prev;
			}, "");
			return a;
		};
		return (
			<p data-key={childIndex} data-selectable={true}>
				{children}
			</p>
		);
	},
	blocks: {
		banner: ({node}) => (
			<BannerBlock className="col-start-2 mb-4" {...node.fields} />
		),
		mediaBlock: ({node}) => (
			<MediaBlock className="col-span-3 col-start-1" imgClassName="m-0"
			            {...node.fields} captionClassName="mx-auto max-w-[48rem]"
			            enableGutter={false} disableInnerContainer={true} />
		),
		code: ({node}) => <CodeBlock className="col-start-2" {...node.fields} />,
		cta: ({node}) => <CallToActionBlock {...node.fields} />,
	},
});

type Props = {
	collection?: CollectionSlug;
	data: DefaultTypedEditorState;
	enableGutter?: boolean;
	enableProse?: boolean;
} & ComponentPropsWithoutRef<"div">;

export default function RichText(props: Props) {
	const {className, enableProse = true, enableGutter = true, ...rest} = props;
	return (
		<ConvertRichText disableContainer={true} converters={jsxConverters} className={cn(
			"payload-richtext",
			{
				container: enableGutter,
				"max-w-none": !enableGutter,
				"prose md:prose-md dark:prose-invert mx-auto": enableProse,
			},
			className,
		)}
		                 {...rest} />
	);
}
