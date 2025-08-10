'use client'
import {useEffect} from 'react'
import {
	FORMAT_TEXT_COMMAND,
	COMMAND_PRIORITY_LOW,
	$getSelection,
	$getRoot,
	$createParagraphNode,
	KEY_DELETE_COMMAND,
	KEY_BACKSPACE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	DELETE_CHARACTER_COMMAND,
	CUT_COMMAND,
	DRAGSTART_COMMAND,
	DROP_COMMAND,
	PASTE_COMMAND,
	$isRangeSelection,
	$isNodeSelection,
	SELECTION_CHANGE_COMMAND,
	$createTextNode,
	CommandPayloadType,
} from 'lexical'
import {StickyHeadingNode} from './StickyHeading'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {objectKlassEquals} from '@lexical/utils'
import {PluginComponent} from '@payloadcms/richtext-lexical'
// --- Plugin to Restrict Formatting on First Node ---
export const RestrictFirstNodePlugin: PluginComponent = () => {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		const unregister = [
			editor.registerCommand(
				FORMAT_TEXT_COMMAND,
				(payload) => {
					const root = $getRoot()
					const firstChild = root.getFirstChild()

					const selection = $getSelection()
					if (selection) {
						if (selection.isCollapsed()) {
							const nodes = selection.getNodes()
							if (nodes.length > 0) {
								const firstNode = nodes[0]
								if (firstNode && firstNode.is(firstChild)) {
									return true
								}
							}
						}
						if ($isRangeSelection(selection)) {
							const anchorNode = selection.anchor.getNode()
							if (anchorNode.is(firstChild)) {
								return true
							}
						}
					}

					return false
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					editor.getEditorState().read(() => {
						const selection = $getSelection()
						const firstNode = $getRoot().getFirstChild()
						let isFocused = false

						if ($isRangeSelection(selection)) {
							const anchorNode = selection.anchor.getNode()
							const focusNode = selection.focus.getNode()
							isFocused = anchorNode.is(firstNode) || focusNode.is(firstNode)
						} else if ($isNodeSelection(selection)) {
							const selectedNodes = selection.getNodes()
							isFocused = selectedNodes.some((node) => node.is(firstNode))
						}
					})
					return false
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				DELETE_CHARACTER_COMMAND,
				() => {
					const root = $getRoot()
					const firstNode = root.getFirstChild()
					if (root.getChildrenSize() === 1 && firstNode instanceof StickyHeadingNode) {
						firstNode.clear()
						return true
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				() => {
					const root = $getRoot()
					const firstNode = root.getFirstChild()
					if (root.getChildrenSize() === 1 && firstNode instanceof StickyHeadingNode) {
						firstNode.clear()
						return true
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			editor.registerCommand(
				KEY_DELETE_COMMAND,
				() => {
					const root = $getRoot()
					const firstNode = root.getFirstChild()
					if (root.getChildrenSize() === 1 && firstNode instanceof StickyHeadingNode) {
						firstNode.clear()
						return true
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			editor.registerCommand(
				CUT_COMMAND,
				() => {
					const selection = $getSelection()
					if ($isRangeSelection(selection)) {
						const anchorNode = selection.anchor.getNode()
						if (anchorNode.is($getRoot().getFirstChild())) {
							return true
						}
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			editor.registerCommand(
				DRAGSTART_COMMAND,
				() => {
					const selection = $getSelection()
					if ($isRangeSelection(selection)) {
						const anchorNode = selection.anchor.getNode()
						if (anchorNode.is($getRoot().getFirstChild())) {
							return true
						}
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			editor.registerCommand(
				DROP_COMMAND,
				() => {
					const selection = $getSelection()
					if ($isRangeSelection(selection)) {
						const anchorNode = selection.anchor.getNode()
						if (anchorNode.is($getRoot().getFirstChild())) {
							return true
						}
					}
					return false
				},
				COMMAND_PRIORITY_CRITICAL,
			),

			editor.registerCommand(
				PASTE_COMMAND,
				(event: CommandPayloadType<typeof PASTE_COMMAND>) => {
					editor.update(() => {
						const root = $getRoot()
						const clipboardData =
							objectKlassEquals(event, InputEvent) || objectKlassEquals(event,
								KeyboardEvent)
								? null
								: event.clipboardData
						if (!clipboardData) {
							return false
						}
						const clipboard = clipboardData.getData('text/plain') || ''
						const [headingText, ...rest] = clipboard.split(/\r?\n/, 2)

						let firstNode = root.getFirstChild()
						if (firstNode == null) {
							const heading = new StickyHeadingNode('h1')
							heading.append($createTextNode(headingText))
							root.append(heading)
							firstNode = heading
						} else if (!(firstNode instanceof StickyHeadingNode)) {
							const heading = new StickyHeadingNode('h1')
							heading.append($createTextNode(headingText))
							firstNode.insertBefore(heading)
						} else {
							firstNode.clear()
							firstNode.append($createTextNode(headingText))
						}

						if (rest.length > 0) {
							clipboardData.setData('text/plain', rest.join('\n'))
							event.preventDefault()
						} else {
							event.preventDefault() // prevent empty re-paste
						}
					})
					return true
				},
				COMMAND_PRIORITY_CRITICAL,
			),
		]

		editor.update(() => {
			const root = $getRoot()
			if (!root.getFirstChild()) {
				const heading = new StickyHeadingNode('h1')
				heading.append($createParagraphNode())
				root.append(heading)
			}
		})

		return () => {
			unregister.forEach((unreg) => unreg())
		}
	}, [editor])

	return null
}
