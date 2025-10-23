'use client'
import React from 'react'

import {ReferencedLink} from '@/components/UX/Link/referencedLink'
import RichText from '@/payload/fields/RichText'
import type {CallToActionBlock as CTABlockProps} from '@/payload-types'

export const CallToActionBlock: React.FC<
	{
		id?: string
	} & CTABlockProps
> = ({links, richText}) => {
	return (
		<div className="container">
			<div
				className="border-border bg-card flex flex-col gap-8 rounded-sm border p-4 md:flex-row md:items-center md:justify-between">
				<div className="flex max-w-3xl items-center">
					{richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
				</div>
				<div className="flex flex-col gap-8">
					{(links || []).map(({link}, i) => {
						return <ReferencedLink key={i} size="lg" link={link} />
					})}
				</div>
			</div>
		</div>
	)
}
