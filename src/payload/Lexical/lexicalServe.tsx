import {LexicalFrontendEditor} from '@/payload/Lexical/lexicalinstance'
import {defaultEditorLexicalConfig} from '@payloadcms/richtext-lexical'

export const LexicalServe = async () => {
	return <LexicalFrontendEditor config={defaultEditorLexicalConfig} />
}
