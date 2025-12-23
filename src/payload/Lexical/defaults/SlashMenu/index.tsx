/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";
import type {SlashMenuGroup} from "@payloadcms/richtext-lexical";
import {useEditorConfigContext} from "@payloadcms/richtext-lexical/client";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {useTranslation} from "@payloadcms/ui";
import Lenis from "lenis";
import {useLenis} from "lenis/react";
import type {ComponentPropsWithRef} from "react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactElement
} from "react";
import {createPortal} from "react-dom";
import {LexicalTypeaheadMenuPlugin} from "./LexicalTypeAheadMenuPlugin";
import type {
	SlashMenuGroupInternal,
	SlashMenuItemInternal
} from "./LexicalTypeAheadMenuPlugin/types";
import {useMenuTriggerMatch} from "./useMenuTriggerMatch";

const baseClass = "slash-menu-popup";

function SlashMenuItem({
	                       isSelected,
	                       item,
	                       onClick,
	                       onMouseEnter,
	                       ...rest
                       }: ComponentPropsWithRef<"button"> & {
	index: number;
	isSelected: boolean;
	item: SlashMenuItemInternal;
	onClick: () => void;
	onMouseEnter: () => void;
}) {
	const {
		fieldProps: {featureClientSchemaMap, schemaPath}
	} = useEditorConfigContext();

	const {i18n} = useTranslation<{}, string>();

	let className = `${baseClass}__item ${baseClass}__item-${item.key}`;
	if (isSelected) {
		className += ` ${baseClass}__item--selected`;
  }

	let title = item.key;
	if (item.label) {
		title =
			typeof item.label === "function"
				? item.label({featureClientSchemaMap, i18n, schemaPath})
				: item.label;
  }
	// Crop title to max. 25 characters
	if (title.length > 25) {
		title = title.substring(0, 25) + "...";
	}

	return (
		<button
			aria-selected={isSelected}
			className={className}
			id={baseClass + "__item-" + item.key}
			key={item.key}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			role="option"
			tabIndex={-1}
			type="button"
			{...rest}
		>
			{item?.Icon && <item.Icon/>}

			<span className={`${baseClass}__item-text`}>{title}</span>
		</button>
	);
}

export function SlashMenuPlugin({
	                                anchorElem = document.body
                                }: {
	anchorElem?: HTMLElement;
}): ReactElement {
	const [editor] = useLexicalComposerContext();
	const [queryString, setQueryString] = useState<null | string>(null);
	const {editorConfig} = useEditorConfigContext();
	const {i18n} = useTranslation<{}, string>();
	const {
		fieldProps: {featureClientSchemaMap, schemaPath}
	} = useEditorConfigContext();

	const checkForTriggerMatch = useMenuTriggerMatch("/", {
		minLength: 0
	});
	const getDynamicItems = useCallback(() => {
		let groupWithItems: Array<SlashMenuGroup> = [];

		for (const dynamicItem of editorConfig.features.slashMenu.dynamicGroups) {
			if (queryString) {
				const dynamicGroupWithItems = dynamicItem({
					editor,
					queryString
				});
				groupWithItems = groupWithItems.concat(dynamicGroupWithItems);
			}
		}
		return groupWithItems;
	}, [editor, queryString, editorConfig?.features]);
	const lenis = useLenis();
	const lenisRef = useRef<Lenis | null>(null);
	const contentRef = useRef<HTMLDivElement>(null!);
	const wrapperRef = useRef<HTMLDivElement>(null!);
	const onEnter = useCallback(() => {
		lenis?.stop();
	}, [lenis]);
	const onLeave = useCallback(() => {
		lenis?.start();
	}, [lenis]);
	useEffect(() => {
		let lnis = lenisRef.current;
		if (lenis) {
			const content = contentRef.current;
			const wrapper = wrapperRef.current;
			if (!content || !wrapper) return;

			lnis = new Lenis({
				wrapper,
				content,
				autoRaf: true
			});
			lenisRef.current = lnis;
		}
		return () => {
			lnis && lnis.destroy();
			lnis = null;
			lenisRef.current = null;
		};
	}, [lenis]);
	const groups: SlashMenuGroup[] = useMemo(() => {
		let groupsWithItems: SlashMenuGroup[] = [];
		for (const groupWithItem of editorConfig?.features.slashMenu.groups ?? []) {
			groupsWithItems.push(groupWithItem);
		}

		if (queryString) {
			// Filter current groups first
			// @ts-expect-error - TODO: fix this
			groupsWithItems = groupsWithItems.map((group) => {
				const filteredItems = group.items.filter((item) => {
					let itemTitle = item.key;
					if (item.label) {
						itemTitle =
							typeof item.label === "function"
								? item.label({featureClientSchemaMap, i18n, schemaPath})
								: item.label;
					}

					if (new RegExp(queryString, "gi").exec(itemTitle)) {
						return true;
					}
					if (item.keywords != null) {
						return item.keywords.some((keyword) =>
							new RegExp(queryString, "gi").exec(keyword)
						);
					}
					return false;
				});
				if (filteredItems.length) {
					return {
						...group,
						items: filteredItems
					};
				}
				return null;
			});

			groupsWithItems = groupsWithItems.filter((group) => group != null);

			// Now add dynamic groups
			const dynamicItemGroups = getDynamicItems();

			// merge dynamic items into groups
			for (const dynamicGroup of dynamicItemGroups) {
				// 1. find the group with the same name or create new one
				let group = groupsWithItems.find(
					(group) => group.key === dynamicGroup.key
				);
				if (!group) {
					group = {
						...dynamicGroup,
						items: []
					};
				} else {
					groupsWithItems = groupsWithItems.filter(
						(group) => group.key !== dynamicGroup.key
					);
				}

				// 2. Add items to group items array and add to sanitized.slashMenu.groupsWithItems
				if (group?.items?.length) {
					group.items = group.items.concat(group.items);
				}
				groupsWithItems.push(group);
			}
		}
		return groupsWithItems;
	}, [
		queryString,
		editorConfig?.features.slashMenu.groups,
		getDynamicItems,
		featureClientSchemaMap,
		i18n,
		schemaPath
	]);
	return (
		<LexicalTypeaheadMenuPlugin
			anchorElem={anchorElem}
			groups={groups as SlashMenuGroupInternal[]}
			menuRenderFn={(
				anchorElementRef,
				{selectedItemKey, selectItemAndCleanUp, setSelectedItemKey}
			) =>
				anchorElementRef.current && groups.length
					? createPortal(
						<div
							ref={wrapperRef}
							className={baseClass}
							onMouseEnter={onEnter}
							onMouseLeave={onLeave}
						>
							<div ref={contentRef} className={"relative h-full w-full"}>
								{groups.map((group) => {
									let groupTitle = group.key;
									if (group.label && featureClientSchemaMap) {
										groupTitle =
											typeof group.label === "function"
												? group.label({
													featureClientSchemaMap,
													i18n,
													schemaPath
												})
												: group.label;
									}
									return (
										<div
											className={`${baseClass}__group ${baseClass}__group-${group.key}`}
											key={group.key}
										>
											<div className={`${baseClass}__group-title`}>
												{groupTitle}
											</div>
											{group.items.map((item, oi: number) => (
												<SlashMenuItem
													index={oi}
													isSelected={selectedItemKey === item.key}
													item={item as SlashMenuItemInternal}
													key={item.key}
													onClick={() => {
														setSelectedItemKey(item.key);
														selectItemAndCleanUp(item);
													}}
													onMouseEnter={() => {
														setSelectedItemKey(item.key);
													}}
													ref={(el) => {
														(item as SlashMenuItemInternal).ref = {
															current: el
														};
													}}
												/>
											))}
										</div>
									);
								})}
							</div>
						</div>,
						anchorElementRef.current
					)
					: null
			}
			onQueryChange={setQueryString}
			triggerFn={checkForTriggerMatch}
    />
  );
}
