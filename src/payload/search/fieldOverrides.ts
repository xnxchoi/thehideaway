import {createCuid} from '@/utilities/stringUtilities'
import type {Field} from 'payload'

export const searchFields: Field[] = [

	{
		name: 'slug',
		type: 'text',
		index: true,
		admin: {
			readOnly: true,
		},
	},
	{
		name: 'owner',
		type: 'array',
		fields: [
			{
				name: 'ownerId',
				type: 'text'
			}
		]
	},
	{
		name: 'allowList',
		type: 'array',
		fields: [{
			type: 'text',
			name: 'allowListId'
		}
		],
		index: true,
	}, {
		name: 'locked',
		type: 'checkbox',
		index: true,
		defaultValue: false
	}, {
		name: 'authority',
		type: 'number',
		index: true,
		defaultValue: 0,
	}, {
		name: 'tags',
		type: 'array',
		maxRows: 5,
		defaultValue: [],
		index: true,
		fields: [
			{name: 'title', type: 'text', required: true},
			{name: 'tagId', type: 'text', required: true}
		]
	},
	{
		name: 'image',
		type: 'array',
		index: true,
		admin: {
			readOnly: true
		},
		maxRows: 1,
		fields: [
			{
				type: 'text',
				name: 'reference',
				required: true,
			}
			, {
				type: 'select',
				name: 'relationTo',
				options: ['userMedia', 'media', 'external'],
				required: true,
			}
		]
	},
	{
		name: 'meta',
		label: 'Meta',
		type: 'group',
		index: true,
		admin: {
			readOnly: true,
		},
		fields: [
			{
				type: 'text',
				name: 'title',
				label: 'Title',
			},
			{
				type: 'text',
				name: 'description',
				label: 'Description',
			},
			{
				name: 'image',
				label: 'Image',
				type: 'upload',
				relationTo: 'media',
			},
		],
	},
	{
		label: 'Categories',
		name: 'category',
		type: 'array',
		maxRows: 1,
		admin: {
			readOnly: true,
		},
		fields: [
			{
				name: 'categoryId',
				type: 'text', required: true
			},
			{
				name: 'title',
				type: 'text', required: true
			},
		],
	},
]
