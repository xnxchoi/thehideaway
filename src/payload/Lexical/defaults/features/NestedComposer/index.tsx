/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {invariant} from "@/components/editor/shared/invariant";
import {warnOnlyOnce} from "@/components/editor/shared/warn-only-once";
import {
	createLexicalComposerContext,
	LexicalComposerContext,
	LexicalComposerContextType
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
	createSharedNodeState,
	EditableListener,
	EditorThemeClasses,
	getRegisteredNode,
	getStaticNodeConfig, Klass,
	KlassConstructor, LexicalEditor, LexicalNode, LexicalNodeReplacement, Transform
} from "lexical";
import {JSX, ReactNode, useContext, useEffect, useMemo, useRef} from "react";

/** @internal */
export function getTransformSetFromKlass(
	klass: KlassConstructor<typeof LexicalNode>,
): Set<Transform<LexicalNode>> {
	const transforms = new Set<Transform<LexicalNode>>();
	const staticTransforms = new Set<(typeof klass)["transform"]>();
	let currentKlass: undefined | typeof klass = klass;
	while (currentKlass) {
		const {ownNodeConfig} = getStaticNodeConfig(currentKlass);
		const staticTransform = currentKlass.transform;
		if (!staticTransforms.has(staticTransform)) {
			staticTransforms.add(staticTransform);
			const transform = currentKlass.transform();
			if (transform) {
				transforms.add(transform);
			}
		}
		if (ownNodeConfig) {
			const $transform = ownNodeConfig.$transform;
			if ($transform) {
				transforms.add($transform);
			}
			currentKlass = ownNodeConfig.extends;
		} else {
			const parent = Object.getPrototypeOf(currentKlass);
			currentKlass =
				//@ts-expect-error the lexical library exports LexicalNode as a type, but it's really a class
				parent.prototype instanceof LexicalNode && parent !== LexicalNode
					? parent
					: undefined;
		}
	}
	return transforms;
}

export interface LexicalNestedComposerProps {
	/**
	 * Any children (e.g. plug-ins) for this editor. Note that the nested editor
	 * does not inherit any plug-ins or registrations from those plug-ins (such
	 * as transforms and command listeners that may be necessary for correct
	 * operation of those nodes) from the parent editor. If you are using nodes
	 * that require plug-ins they must also be instantiated here.
	 */
	children?: ReactNode;
	/**
	 * The nested editor, created outside of this component (typically in the
	 * implementation of a LexicalNode) with {@link createEditor}
	 */
	initialEditor: LexicalEditor;
	/**
	 * Optionally overwrite the theme of the initialEditor
	 */
	initialTheme?: EditorThemeClasses;
	/**
	 * @deprecated This feature is not safe or correctly implemented and will be
	 * removed in v0.32.0. The only correct time to configure the nodes is when
	 * creating the initialEditor.
	 *
	 * @example
	 * ```ts
	 * // This is normally in the implementation of a LexicalNode that
	 * // owns the nested editor
	 * editor = createEditor({nodes: [], parentEditor: $getEditor()});
	 * ```
	 */
	initialNodes?: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>;

	/**
	 * If this is not explicitly set to true, the editable state of the nested
	 * editor will automatically follow the parent editor's editable state.
	 * When set to true, the nested editor is responsible for managing its own
	 * editable state.
	 *
	 * Available since v0.29.0
	 */
	skipEditableListener?: undefined | true;
}

const initialNodesWarning = warnOnlyOnce(
	`LexicalNestedComposer initialNodes is deprecated and will be removed in v0.32.0, it has never worked correctly.\nYou can configure your editor's nodes with createEditor({nodes: [], parentEditor: $getEditor()})`,
);
const explicitNamespaceWarning = warnOnlyOnce(
	`LexicalNestedComposer initialEditor should explicitly initialize its namespace when the node configuration differs from the parentEditor. For backwards compatibility, the namespace will be initialized from parentEditor until v0.32.0, but this has always had incorrect copy/paste behavior when the configuration differed.\nYou can configure your editor's namespace with createEditor({namespace: 'nested-editor-namespace', nodes: [], parentEditor: $getEditor()}).`,
);

export function LexicalNestedComposer({
	                                      initialEditor,
	                                      children,
	                                      initialNodes,
	                                      initialTheme,
	                                      skipEditableListener,
                                      }: LexicalNestedComposerProps): JSX.Element {
	const parentContext = useContext(LexicalComposerContext);

	if (parentContext == null) {
		invariant(false, "Unexpected parent context null on a nested composer");
	}

	const [parentEditor, {getTheme: getParentTheme}] = parentContext;

	const composerContext: [LexicalEditor, LexicalComposerContextType] = useMemo(
		() => {
			const composerTheme: EditorThemeClasses | undefined =
				initialTheme || getParentTheme() || undefined;

			const context: LexicalComposerContextType = createLexicalComposerContext(
				parentContext,
				composerTheme,
			);

			if (composerTheme !== undefined) {
				initialEditor._config.theme = composerTheme;
			}

			initialEditor._parentEditor = initialEditor._parentEditor || parentEditor;
			const createEditorArgs = initialEditor._createEditorArgs;
			const explicitNamespace = createEditorArgs && createEditorArgs.namespace;

			if (!initialNodes) {
				if (!(createEditorArgs && createEditorArgs.nodes)) {
					const parentNodes = (initialEditor._nodes = new Map(
						parentEditor._nodes,
					));
					if (!explicitNamespace) {
						// This is the only safe situation to inherit the parent's namespace
						initialEditor._config.namespace = parentEditor._config.namespace;
					}
					for (const [type, entry] of parentNodes) {
						initialEditor._nodes.set(type, {
							exportDOM: entry.exportDOM,
							klass: entry.klass,
							replace: entry.replace,
							replaceWithKlass: entry.replaceWithKlass,
							sharedNodeState: createSharedNodeState(entry.klass),
							transforms: getTransformSetFromKlass(entry.klass),
						});
					}
				} else if (!explicitNamespace) {
					if (explicitNamespaceWarning) {
						explicitNamespaceWarning();
					}
					initialEditor._config.namespace = parentEditor._config.namespace;
				}
			} else {
				if (initialNodesWarning) {
					initialNodesWarning();
				}
				if (!explicitNamespace) {
					if (explicitNamespaceWarning) {
						explicitNamespaceWarning();
					}
					initialEditor._config.namespace = parentEditor._config.namespace;
				}
				for (let klass of initialNodes) {
					let replace = null;
					let replaceWithKlass = null;

					if (typeof klass !== "function") {
						const options = klass;
						klass = options.replace;
						replace = options.with;
						replaceWithKlass = options.withKlass || null;
					}
					const registeredKlass = getRegisteredNode(
						initialEditor,
						klass.getType(),
					);

					initialEditor._nodes.set(klass.getType(), {
						exportDOM: registeredKlass ? registeredKlass.exportDOM : undefined,
						klass,
						replace,
						replaceWithKlass,
						sharedNodeState: createSharedNodeState(klass),
						transforms: getTransformSetFromKlass(klass),
					});
				}
			}

			return [initialEditor, context];
		},

		// We only do this for init
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// Update `isEditable` state of nested editor in response to the same change on parent editor.
	useEffect(() => {
		if (!skipEditableListener) {
			const editableListener: EditableListener = (editable) =>
				initialEditor.setEditable(editable);
			editableListener(parentEditor.isEditable());
			return parentEditor.registerEditableListener(editableListener);
		}
	}, [initialEditor, parentEditor, skipEditableListener]);

	return (
		<LexicalComposerContext.Provider value={composerContext}>
			{children}
		</LexicalComposerContext.Provider>
	);
}