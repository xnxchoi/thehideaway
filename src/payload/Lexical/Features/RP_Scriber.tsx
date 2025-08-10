import {HeadingNode, QuoteNode} from '@lexical/rich-text'
import {ListItemNode, ListNode} from '@lexical/list'
import {StickyHeadingNode} from './StickyHeading'
import {HashtagNode} from '@lexical/hashtag'
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin'
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin'
import {LexicalComposer} from '@lexical/react/LexicalComposer'
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin'
import {RestrictFirstNodePlugin} from './RestrictRemovalPlugin'
import {ContentEditable} from '@lexical/react/LexicalContentEditable'
import {useField} from '@payloadcms/ui'
import {useMemo, useState} from 'react'
import {debounce} from 'lodash-es'
import {$getRoot, EditorState, ParagraphNode} from 'lexical'
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary'

const editorConfig = {
	theme: {},
	onError: (e: Error) => console.error(e),
	nodes: [
		HeadingNode,
		StickyHeadingNode,
		ParagraphNode,
		QuoteNode,
		ListNode,
		ListItemNode,
		HashtagNode,
	],
	namespace: 'RP_Scriber',
}
const extractTitleText = () => {
	const root = $getRoot()
	const firstNode = root.getFirstChild()
	if (firstNode instanceof StickyHeadingNode) {
		return firstNode.getTextContent()
	}
	return ''
}
const CustomRichText = () => {
	const {setValue} = useField({path: 'title'})
	const [isFirstNodeFocused, setIsFirstNodeFocused] = useState(false)

	const debouncedUpdateTitle = useMemo(
		() =>
			debounce((editorState: EditorState) => {
				editorState.read(() => {
					const newTitle = extractTitleText()
					setValue(newTitle)
				})
			}, 150),
		[setValue],
	)

	const onChange = (editorState: EditorState) => {
		debouncedUpdateTitle(editorState)
	}

	return (
		<div>
			<div className="toolbar">
				<button disabled={isFirstNodeFocused}>Bold</button>
				<button disabled={isFirstNodeFocused}>Italic</button>
				<button disabled={isFirstNodeFocused}>Convert</button>
			</div>
			<LexicalComposer initialConfig={editorConfig}>
				<RichTextPlugin contentEditable={<ContentEditable className="editor-input" />}
				                placeholder={<div className="editor-placeholder">Enter
				                                                                 text...</div>}
				                ErrorBoundary={LexicalErrorBoundary} />
				<OnChangePlugin onChange={onChange} />
				<HistoryPlugin />
				<RestrictFirstNodePlugin onFirstNodeFocusChange={setIsFirstNodeFocused} />
			</LexicalComposer>
		</div>
	)
}

export default CustomRichText
