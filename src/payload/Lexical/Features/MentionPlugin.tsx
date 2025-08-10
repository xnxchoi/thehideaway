// MentionPlugin.js

import {useCallback, useMemo, useState} from "react";
import {$createMentionNode} from "./MentionNode";

import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/LexicalTypeaheadMenuPlugin";
import {useLexicalComposerContext} from "@lexical/@lexical-react/LexicalComposerContext";
import {getPayload} from "payload";
import configPromise from "@payload-config";

class MentionOption extends MenuOption {
	__user: { id: string; slug: string; image?: string | null };

	constructor(user: { id: string; slug: string; image?: string | null }) {
		super(user.slug);
		this.__user = user;
	}
}

function MentionSuggestionItem({option, isSelected, onMouseEnter, onClick}) {
	const {user} = option;

	return (
		<div className={`mention-suggestion-item ${isSelected ? "selected" : ""}`}
		     onMouseEnter={onMouseEnter} onClick={onClick}>
			{user.image ? (
				<div className="mention-suggestion-item-image">
					<img src={user.image?.url} alt={user.slug} />
				</div>
			) : (
				<div className="mention-suggestion-item-avatar">
					{user.slug.charAt(0).toUpperCase()}
				</div>
			)}
			<div className="mention-suggestion-item-text">{user.slug}</div>
		</div>
	);
}

export async function MentionPlugin() {
	const [editor] = useLexicalComposerContext();
	const [queryResults, setQueryResults] = useState<
		{ id: string; slug: string; image?: string | null }[]
	>([]);
	const payload = await getPayload({config: configPromise});
	const fetchUsers = useCallback(async (query) => {
		try {
			// Query Payload CMS for users
			const response = await payload.find({
				collection: "users",
				where: {
					slug: {
						contains: query,
					},
				},
				limit: 5,
				select: {
					id: true,
					slug: true,
					image: true,
				},
			});

			return response.docs;
		} catch (error) {
			console.error("Error fetching users:", error);
			return [];
		}
	}, []);

	const onQueryChange = useCallback(
		async (query) => {
			const results = await fetchUsers(query);
			setQueryResults(results);
		},
		[fetchUsers],
	);

	const checkForAtSignMatch = useBasicTypeaheadTriggerMatch("@", {
		minLength: 0,
	});

	const options = useMemo(
		() => queryResults.map((user) => new MentionOption(user)),
		[queryResults],
	);

	const onSelectOption = useCallback(
		(selectedOption, nodeToReplace, closeMenu) => {
			editor.update(() => {
				const mentionNode = $createMentionNode(
					selectedOption.user,
					selectedOption.user.slug,
				);

				if (nodeToReplace) {
					nodeToReplace.replace(mentionNode);
				}

				mentionNode.select();
				closeMenu();
			});
		},
		[editor],
	);

	return (
		<LexicalTypeaheadMenuPlugin options={options} onQueryChange={onQueryChange}
		                            onSelectOption={onSelectOption} triggerFn={checkForAtSignMatch}
		                            menuRenderFn={(
			                            anchorElementRef,
			                            {
				                            selectedIndex,
				                            selectOptionAndCleanUp,
				                            setHighlightedIndex
			                            },
		                            ) => {
			                            if (anchorElementRef.current && options.length) {
				                            return (
					                            <div className="mention-suggestion-list" style={{
						                            position: "absolute",
						                            left: anchorElementRef.current.getBoundingClientRect().left,
						                            top: anchorElementRef.current.getBoundingClientRect().bottom,
						                            zIndex: 10,
						                            background: "white",
						                            border: "1px solid #ccc",
						                            borderRadius: "4px",
					                            }}>
						                            {options.map((option, i) => (
							                            <MentionSuggestionItem key={option.key}
							                                                   option={option}
							                                                   isSelected={selectedIndex === i}
							                                                   onClick={() => {
								                                                   setHighlightedIndex(
									                                                   i);
								                                                   selectOptionAndCleanUp(
									                                                   option);
							                                                   }}
							                                                   onMouseEnter={() => {
								                                                   setHighlightedIndex(
									                                                   i);
							                                                   }} />
						                            ))}
					                            </div>
				                            );
			                            }
			                            return null;
		                            }} />
	);
}
