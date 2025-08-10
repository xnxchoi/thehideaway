'use client'
import {useEffect, useState} from 'react'

import canUseDOM from '@/utilities/canUseDOM'
import {useWindowResize} from '@/utilities/use_window_resize'

const breakpoints = {
	mobile: 768, tablet: 967, laptop: 1200, desktop: 1512, xl: 1800,
}

export const getBreakpoint = (width: number) => {
	if (!width) return null

	if (width <= breakpoints.mobile) return {name: 'mobile', width}
	if (width <= breakpoints.tablet) return {name: 'tablet', width}
	if (width <= breakpoints.laptop) return {name: 'laptop', width}
	if (width <= breakpoints.desktop) return {name: 'desktop', width}
	return {name: 'xl', width}
}

export const getIsMobile = (width: number) => {
	const breakpoint = getBreakpoint(width)
	return (breakpoint?.name === 'mobile' || breakpoint?.name === 'tablet') ?? false
}
export const useIsMobile = function () {
	const l = useWindowResize({
		debounce: 100,
	})
	const [currentBreakpoint, setBreakpoint] = useState(null)
	const [isMobile, setIsMobile] = useState(false)
	useEffect(() => {

		setIsMobile(getIsMobile(window.innerWidth))

	}, [])
	useEffect(() => {
		const l = getBreakpoint(window.innerWidth)
		// @ts-ignore
		setBreakpoint(l), setIsMobile(getIsMobile(window.innerWidth))
	}, [l])

	return {
		breakpoint: currentBreakpoint, isMobile,
	}
}
