import {CollectionSlug, Field} from 'payload'

type MentionOptions = {
	relationTo: CollectionSlug | CollectionSlug[]; label?: string; required?: boolean;
};

// Custom mention field configuration
export const mention = ({
	relationTo, label = 'Mention', required = false,
}: MentionOptions): Field => {
	return {
		name: 'mention', label, type: 'relationship', relationTo, required, hasMany: false,
	}
}