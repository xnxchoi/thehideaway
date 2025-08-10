'use client'
import {useRef} from 'react'

import {DefButtons} from '@/components/UX/Controlbar/layout/buttons/def'

export const SecondaryLayout = () => {
	const ref = useRef<HTMLDivElement>(null!)

	return (<div className="menu-float__layout menu-float__layout--secondary" ref={ref} style={{}}>
		<nav className="menu-float__content">
			<div className="menu-float__progress">
				<div className="menu-float__bar js-menu-progress" />
			</div>
			<div className="menu-float__title-section" />
			<DefButtons />
		</nav>
	</div>)
}
