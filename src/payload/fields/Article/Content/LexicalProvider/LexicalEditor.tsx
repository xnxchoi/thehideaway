"use client";
import {ClipboardPlugin} from "@/payload/Lexical/defaults/ClipboardPlugin";
import {DecoratorPlugin} from "@/payload/Lexical/defaults/DecoratorPlugin";
import {EditorPlugin} from "@/payload/Lexical/defaults/EditorPlugin";
import {AddBlockHandlePlugin} from "@/payload/Lexical/defaults/handles/AddBlockHandlePlugin";
import {DraggableBlockPlugin} from "@/payload/Lexical/defaults/handles/DraggableBlockPlugin";
import {NormalizeSelectionPlugin} from "@/payload/Lexical/defaults/NormalizePlugin";
import {SelectAllPlugin} from "@/payload/Lexical/defaults/SelectAllPlugin";
import {SlashMenuPlugin} from "@/payload/Lexical/defaults/SlashMenu";
import {TextPlugin} from "@/payload/Lexical/defaults/TextPlugin";
import type {LexicalProviderProps} from "@/payload/Lexical/defaults/types";
import {LexicalContentEditable} from "@/payload/Lexical/defaults/ui/ContentEditable";
import {useHandoff} from "@/payload/Lexical/Features/HandOff/handoffBridge";
import {$isCaretAtStart, $selectEnd} from "@/payload/Lexical/lexical-utils";
import {useWriter} from "@/payload/providers/Admins";
import {useEditorConfigContext} from "@payloadcms/richtext-lexical/client";
import {
	$addUpdateTag,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	FOCUS_COMMAND,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_UP_COMMAND,
	KEY_BACKSPACE_COMMAND,
	SKIP_DOM_SELECTION_TAG
} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
	LexicalErrorBoundary
} from "@payloadcms/richtext-lexical/lexical/react/LexicalErrorBoundary";
import {HistoryPlugin} from "@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin";
import {OnChangePlugin} from "@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin";
import {RichTextPlugin} from "@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin";
import {useLexicalEditable} from "@payloadcms/richtext-lexical/lexical/react/useLexicalEditable";
import type {FC, RefObject} from "react";
import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import "./LexicalEditor.scss"

export const LexicalEditor: FC<
	{
		editorContainerRef: RefObject<HTMLDivElement | null>;
		isSmallWidthViewport: boolean;
	} & Pick<LexicalProviderProps, "editorConfig" | "onChange">
> = (props) => {
	const {editorConfig, editorContainerRef, isSmallWidthViewport, onChange} =
		props;

	const [floatingAnchorElem, setFloatingAnchorElem] =
		useState<HTMLDivElement | null>(null);
	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};
	const editorConfigContext = useEditorConfigContext();
	const [editor] = useLexicalComposerContext();
	const isEditable = useLexicalEditable();

	const setEditor = useHandoff((r) => r.setEditor);

	const titleEditor = useHandoff((r) => r.titleEditor);
	const contentRef = useHandoff((r) => r.contentEditor);

	const slashMenuOpen = useWriter((r) => r.slashMenuOpen);
	const menuStateRef = useRef(slashMenuOpen);
	useEffect(() => {
		menuStateRef.current = slashMenuOpen;
	}, [slashMenuOpen]);

	useEffect(() => {
		if (!editor || contentRef === editor) return;
		setEditor({target: "content", editor});
	}, [setEditor, editor, contentRef]);
	const isFocusInEditor = useCallback(() => {
		const editorEl = editor.getRootElement();
		const slashMenustate = !menuStateRef.current;
		if (!editorEl) {
			return false;
		}
		const activeElement = document.activeElement;
		if (activeElement) {
			return (
				!slashMenustate &&
				(editorEl.contains(activeElement) || activeElement === editorEl)
			);
		} else {
			return !slashMenustate;
		}
	}, [editor]);
	useEffect(() => {
		const handleBlur = () => {
			editorConfigContext.blurEditor(editorConfigContext);
		};

		// Register this editor instance with the store

		const unregisterBackspace = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			(event) => {
				// Case e: Arrow Left
				if (isFocusInEditor() && $isCaretAtStart()) {
					// Already at start - prevent event propagation
					event?.preventDefault();
					if (titleEditor) {
						const root = $getRoot();
						$addUpdateTag(SKIP_DOM_SELECTION_TAG);
						if (!root.isEmpty()) {
							// Safely focus title editor if available
							const fd = root.getFirstDescendant();
							if (fd && fd.getTextContentSize() > 0) {
								const text = fd.getTextContent();
								fd.remove();
								handleBlur();
								titleEditor.focus(() => {
									titleEditor.update(() => {
										const root = $getRoot();
										const textC = root.getTextContent();
										root.clear();
										const par = $createParagraphNode().append(
											$createTextNode(textC),
											$createTextNode(text)
										);
										const rs = root.append(par).getLastDescendant();
										const ch = root.getChildren();
										console.log(ch);
										console.log(rs);
									});
								});
								return true;
							}
						}
						handleBlur();
						titleEditor.focus(() => {
							titleEditor.update(() => {
								const root = $getRoot();
								const lastDesc = root.getLastDescendant();
								if (lastDesc) {
									lastDesc.selectEnd();
									return;
								}
								const lastChild = root.getLastChild();
								if (lastChild) {
									lastChild.selectEnd();
								}
								return;
							});
						});
					}

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_HIGH
		);
		const unregisterArrowLeft = editor.registerCommand(
			KEY_ARROW_LEFT_COMMAND,
			(e) => {
				const trulyFocused = isFocusInEditor();
				if (!trulyFocused) return false;
				if (!titleEditor) return false;
				const shouldHandOff = $isCaretAtStart();
				if (shouldHandOff) {
					e.preventDefault();

					handleBlur();
					// Safely focus title editor and blur content editor
					titleEditor.focus();
					titleEditor.getEditorState().read(() => {
						titleEditor.update(() => {
							const root = $getRoot();
							const lastDesc = root.getLastDescendant();
							if (lastDesc) {
								lastDesc.selectEnd();
							} else {
								root.selectEnd();
							}
						});
					});
					return true;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH
		);
		const unregisterArrowUp = editor.registerCommand(
			KEY_ARROW_UP_COMMAND,
			(e) => {
				// Check if we're in an interactive element that should handle its own navigation
				if (!titleEditor) {
					return false;
				}
				const trulyFocused = isFocusInEditor();
				if (!trulyFocused) return false;
				try {
					let isInTopLine = false;

					if ($isCaretAtStart()) {
						isInTopLine = true;
					} else {
						const domSelection = window.getSelection();
						if (domSelection && domSelection.rangeCount > 0) {
							const range = domSelection.getRangeAt(0);
							const rect = range.getBoundingClientRect();
							const editorEl = editor.getRootElement();
							if (editorEl) {
								const editorRect = editorEl.getBoundingClientRect();

								const vertPos = rect.top - editorRect.top;
								const lineHeight = 24; // Approximate line height - adjust as needed

								// If cursor is within the first line height of the editor, consider it "topmost"
								isInTopLine = vertPos <= lineHeight;
							}
						}
					}
					if (isInTopLine) {
						e.preventDefault();
						handleBlur();

						titleEditor.focus(() => {
							titleEditor.update(() => {
								$selectEnd();
							});
							/**
							 * () => {
                const root = $getRoot();
                const lastDesc = root.getLastDescendant();
                if (lastDesc) {
                  lastDesc.selectEnd();
                } else {
                  root.selectEnd();
                }
              }
							 */
						});

						return true;
					}

					return false;
				} catch (error) {
					// Fallback to simpler logic if DOM measurement fails
					console.warn(
						"Failed to measure cursor position, using fallback logic:",
						error
					);
				}

				return false;
			},
			COMMAND_PRIORITY_HIGH
		);

		return () => {
			unregisterArrowUp();
			unregisterBackspace();
			unregisterArrowLeft();
		};
	}, [editor, editorConfigContext, isFocusInEditor, setEditor, titleEditor]); // titleEditor is not needed in deps since it's accessed fresh from store

	useEffect(() => {
		if (editorConfigContext?.parentEditor?.uuid) {
			editorConfigContext.parentEditor?.registerChild(
				editorConfigContext.uuid,
				editorConfigContext
			);
		}
		const handleFocus = () => {
			editorConfigContext.focusEditor(editorConfigContext);
		};
		const handleBlur = () => {
			editorConfigContext.blurEditor(editorConfigContext);
		};

		// Register this editor instance with the store

		const unregisterFocus = editor.registerCommand<MouseEvent>(
			FOCUS_COMMAND,
			(e) => {
				e.preventDefault();
				handleFocus();
				return true;
			},
			COMMAND_PRIORITY_LOW
		);

		const unregisterBlur = editor.registerCommand<MouseEvent>(
			BLUR_COMMAND,
			() => {
				handleBlur();
				return true;
			},
			COMMAND_PRIORITY_LOW
		);

		return () => {
			unregisterFocus();
			unregisterBlur();
			editorConfigContext.parentEditor?.unregisterChild?.(
				editorConfigContext.uuid
			);
		};
	}, [editor, editorConfigContext, setEditor, titleEditor]); // titleEditor is not needed in deps since it's accessed fresh from store

	return (
		<Fragment>
			{editorConfig.features.plugins?.map((plugin) => {
				if (plugin.position === "aboveContainer") {
					return (
						<EditorPlugin
							clientProps={plugin.clientProps}
							key={plugin.key}
							plugin={plugin}
						/>
					);
				}
			})}
			<div className="editor-container" ref={editorContainerRef}>
				{editorConfig.features.plugins?.map((plugin) => {
					if (plugin.position === "top") {
						return (
							<EditorPlugin
								clientProps={plugin.clientProps}
								key={plugin.key}
								plugin={plugin}
							/>
						);
					}
				})}
				<RichTextPlugin
					contentEditable={
						<div className="editor-scroller">
							<div className="editor" id="estate-lexicon" ref={onRef}>
								<LexicalContentEditable editorConfig={editorConfig}/>
							</div>
						</div>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<NormalizeSelectionPlugin/>
				<DecoratorPlugin/>
				<ClipboardPlugin/>
				<TextPlugin features={editorConfig.features}/>
				<SelectAllPlugin/>
				{isEditable && (
					<OnChangePlugin
						// Selection changes can be ignored here, reducing the
						// frequency that the FieldComponent and Payload receive updates.
						// Selection changes are only needed if you are saving selection state
						ignoreSelectionChange
						onChange={(editorState, editor, tags) => {
							// Ignore any onChange event triggered by focus only
							if (!tags.has("focus") || tags.size > 1) {
								if (onChange != null) {
									onChange(editorState, editor, tags);
								}
							}
						}}
					/>
				)}
				{floatingAnchorElem && (
					<Fragment>
						{!isSmallWidthViewport && isEditable && (
							<Fragment>
								{editorConfig.admin?.hideDraggableBlockElement ? null : (
									<DraggableBlockPlugin anchorElem={floatingAnchorElem}/>
								)}
								{editorConfig.admin?.hideAddBlockButton ? null : (
									<AddBlockHandlePlugin anchorElem={floatingAnchorElem}/>
								)}
							</Fragment>
						)}
						{editorConfig.features.plugins?.map((plugin) => {
							if (
								plugin.position === "floatingAnchorElem" &&
								!(plugin.desktopOnly === true && isSmallWidthViewport)
							) {
								return (
									<EditorPlugin
										anchorElem={floatingAnchorElem}
										clientProps={plugin.clientProps}
										key={plugin.key}
										plugin={plugin}
									/>
								);
							}
						})}
						{isEditable && (
							<Fragment>
								<SlashMenuPlugin anchorElem={floatingAnchorElem}/>
							</Fragment>
						)}
					</Fragment>
				)}
				{isEditable && (
					<Fragment>
						<HistoryPlugin/>
					</Fragment>
				)}
				{editorConfig.features.plugins?.map((plugin) => {
					if (plugin.position === "normal") {
						return (
							<EditorPlugin
								clientProps={plugin.clientProps}
								key={plugin.key}
								plugin={plugin}
							/>
						);
					}
				})}
				{editorConfig.features.plugins?.map((plugin) => {
					if (plugin.position === "bottom") {
						return (
							<EditorPlugin
								clientProps={plugin.clientProps}
								key={plugin.key}
								plugin={plugin}
							/>
						);
					}
				})}
			</div>
			{editorConfig.features.plugins?.map((plugin) => {
				if (plugin.position === "belowContainer") {
					return (
						<EditorPlugin
							clientProps={plugin.clientProps}
							key={plugin.key}
							plugin={plugin}
						/>
					);
				}
			})}
		</Fragment>
	);
};
