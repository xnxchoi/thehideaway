import React from 'react'

import {RP_Footer} from '@/payload/collections/Footer/Component.client'
import type {Footer} from '@/payload-types'
import {getCachedGlobal} from '@/utilities/getGlobals'

export async function Footer() {
	const footer: Footer = (await getCachedGlobal('footer', 1)()) as Footer

	const navItems = footer?.navItems || []
	const videoLoop = {
		...footer.videoLoop,
		desktop:
			footer.videoLoop && typeof footer.videoLoop.desktop === 'object'
				? footer.videoLoop.desktop
				: null,
		mobile:
			footer.videoLoop && typeof footer.videoLoop.mobile === 'object'
				? footer.videoLoop.mobile
				: null,
	}
	return <></>
}
