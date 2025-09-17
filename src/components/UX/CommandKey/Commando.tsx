"use client";
import React, { ReactNode, useEffect, useState } from "react";
import {
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { useDebounce } from "@/utilities/useDebounce";
import { useSearchBar } from "@/providers/RP_Pro";
import { useLenis } from "lenis/react";
import { isInternalLink } from "@/utilities/isInternalLink";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { CreditCard, Settings, User } from "lucide-react";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useTransitionRouter } from "next-transition-router";

export function Commando() {
	const user = useRPSession((l) => l);

	const [loading, setLoading] = useState<boolean>(false);
	const [items, setItems] = useState<
		{
			category: any[];
			createdAt: string;
			doc: { relationTo: string; value: string };
			id: string;
			meta: {
				description: string;
				image: {
					id: string;
					alt: string;
					caption: { [x: string]: any };
					filename: string;
					mimeType: string;
				};
				title: string;
			};
			slug: string;
			title: string;
			updatedAt: string;
		}[]
	>([]);
	const [init, setInit] = useState(true);
	const value = useSearchBar((l) => l.value);
	const debouncedValue = useDebounce(value);
	const open = useSearchBar((l) => l.open);
	useEffect(() => {
		async function load() {
			if (open && debouncedValue.length > 0) {
				setLoading(true);
				setInit(false);
				const ite = await fetch(
					"/api/search/?q=" + encodeURIComponent(debouncedValue),
					{
						method: "GET",
					},
				);
				if (ite.ok) {
					const a = await ite.json();
					if (a.docs && a.docs.length > 0) {
						setItems(a.docs.map((doc) => doc));
					} else {
						setItems([]);
					}
				} else {
					setItems([]);
				}
				setLoading(false);
			} else {
				setItems([]);
				setInit(true);
				setLoading(false);
			}
		}

		load();
	}, [debouncedValue]);

	return (
		<CommandList>
			{items.length > 0 && (
				<CommandGroup heading="Search Results">
					{items.map((doc) => (
						<LinkedItem key={doc.id + "command_doc"} {...doc}></LinkedItem>
					))}
					{!loading && items.length === 0 && (
						<CommandEmpty>Nothing found :(</CommandEmpty>
					)}
				</CommandGroup>
			)}
			<CommandSeparator />
			{user && (
				<CommandGroup heading="Settings">
					<LinkedCommandItem value="profile" href={`/users/${user.slug}`} title="Profile">
						<User />
					</LinkedCommandItem>
					<CommandItem>
						<CreditCard />
						<span>Billing</span>
					</CommandItem>
					<CommandItem>
						<Settings />
						<span>Settings</span>
					</CommandItem>
				</CommandGroup>
			)}
		</CommandList>
	);
}

function Item({
	children,
	value,
	keywords,
	isCommand = false,
}: {
	children: React.ReactNode;
	value: string;
	keywords?: string[];
	isCommand?: boolean;
}) {
	return (
		<CommandItem value={value} keywords={keywords} onSelect={() => {
		}}>
			{children}
			<span cmdk-raycast-meta="">{isCommand ? "Command" : "Application"}</span>
		</CommandItem>
	);
}

export const LinkedCommandItem = (props: {
	href: string;
	title: string;
	value?: string;
	type?: string;
	children?: ReactNode;
	[x: string]: any;
}) => {
	const { href, title, value, ...rest } = props;
	const lenis = useLenis();
	const router = useTransitionRouter();
	const setOpen = useSearchBar((l) => l.setOpen);
	const url = useVoyageur((l) => l.url);
	const pathName = useVoyageur((l) => l.pathName);
	const isAnchor = href === url || href.startsWith(`${pathName}#`);
	const handleClick = () => {
		setOpen(false);
		if (isAnchor) {
			lenis && lenis.scrollTo(href);
		} else {
			router.push(decodeURIComponent(href));
		}
	};
	return (
		<CommandItem data-themed={"color,background-color"} value={value ?? href}
			onSelect={handleClick}>
			{rest.children}
			{title}
			{rest.type && (
				<div className="rp_tag absolute right-2">
					{rest.type.endsWith("s") ? rest.type.slice(0, -1) : rest.type}
				</div>
			)}
		</CommandItem>
	);
};

export const LinkedItem = (props: {
	category: any[];
	createdAt: string;
	doc: { relationTo: string; value: string };
	id: string;
	name?: string;
	meta: {
		description: string;
		image?: {
			id: string;
			alt: string;
			caption: { [x: string]: any };
			filename: string;
			mimeType: string;
		};
		title: string;
	};
	slug?: string;
	title?: string;
	updatedAt: string;
}) => {
	const { doc, category, createdAt, updatedAt, id, name, meta, slug, title } =
		props;

	const href = `${doc?.relationTo === "pages" ? "" : (doc?.relationTo ?? "")}/${doc?.relationTo === "users" ? meta.title : slug || meta.title}`;
	const isExternal = !isInternalLink(href);

	const internalLinkProps = {
		target: isExternal ? "_blank" : undefined,
		rel: isExternal ? "noopener noreferrer" : undefined,
	};
	return (
		<LinkedCommandItem href={href} value={meta.title || title || name || href}
			title={meta.title || title || name || ""} type={doc?.relationTo}
			{...internalLinkProps} />
	);
};
