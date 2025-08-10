'use client'

import React, {ReactNode, useEffect} from 'react'

import {useHeaderTheme} from '@/providers/HeaderTheme'
import * as m from 'motion/react-m'
import {useTabMessenger} from '@/utilities/visibilityChange'

const PageClient = (props: { children: ReactNode; title: string }) => {
	/* Force the header to be dark mode while we have an image behind it */
	const {setHeaderTheme} = useHeaderTheme()
	useEffect(() => {
		setHeaderTheme('dark')
	}, [setHeaderTheme])
	const setTitle = useTabMessenger((store) => store.setTitle)
	useEffect(() => {
		setTitle(props.title)
	}, [setTitle])
	return <m.article className="pt-16 pb-24">{props.children}</m.article>
}

export default PageClient
