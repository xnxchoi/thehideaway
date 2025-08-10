import React from 'react'

import {HighImpactHero} from '@/payload/blocks/heros/HighImpact'
import {LowImpactHero} from '@/payload/blocks/heros/LowImpact'
import {MediumImpactHero} from '@/payload/blocks/heros/MediumImpact'
import type {Page} from '@/payload-types'

const heroes = {
	highImpact: HighImpactHero,
	lowImpact: LowImpactHero,
	mediumImpact: MediumImpactHero,
}

export const RenderHero: React.FC<Page['hero']> = (props) => {
	const {type} = props || {}

	if (!type || type === 'none') return null

	const HeroToRender = heroes[type]

	if (!HeroToRender) return null

	return <HeroToRender {...props} />
}
