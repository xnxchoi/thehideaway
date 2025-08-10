'use client'
import {forwardRef, HTMLAttributes} from 'react'

import {PrimaryLayout} from '@/components/UX/Controlbar/layout/primary'
import {RadioLayout} from '@/components/UX/Controlbar/layout/radio'
import {SecondaryLayout} from '@/components/UX/Controlbar/layout/secondary'

export const BottomMenu = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(props, ref) => {
		return (<div className="menu-float__bottom" ref={ref} {...props}>
			<PrimaryLayout />
			<SecondaryLayout />
			<RadioLayout />
		</div>)
	})
