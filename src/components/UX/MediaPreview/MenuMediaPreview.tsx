'use client'
import {useRPStore} from '@/providers/RP_Pro'
import {useCallback, useEffect, useRef, useState} from 'react'
import gsap from 'gsap'
import {getIsMobile, useIsMobile} from '@/utilities/getBreakpoints'
import {cn} from '@/lib/utils'
import {useWindowResize} from '@/utilities/use_window_resize'
import {useCurrentPage} from '@/hooks/useCurrentPage'
import {VGradient} from '../Gradient/Gradient'

interface PreviewItem extends Partial<HTMLDivElement> {
	resetElement: () => void
	setVisibility: () => void
}

const y = {
	in: 0.4,
}
const defaultConfig = {
	debounce: 100,
}

export const MenuMediaPreview = (l) => {
	const navOpeningElement = useRPStore((l) => l.navOpeningElement)
	const getDefaultSizingValues = () => {
		if (!navOpeningElement) return false
		let l = {
			width: window.innerWidth,
			height: window.innerHeight,
			scale: 1.1 * (navOpeningElement.offsetHeight / window.innerHeight),
			y: 0,
		}
		if (getIsMobile(window.innerWidth)) {
			let d = window.innerWidth,
				h = 1.32 * window.innerWidth,
				p =
					(null == navOpeningElement ? void 0 : navOpeningElement.getBoundingClientRect().top) || 0,
				m = (null == navOpeningElement ? void 0 : navOpeningElement.offsetHeight) || 0
			l = {
				width: d,
				height: h,
				scale: 1,
				y: p - (0.5 * h - 0.5 * m),
			}
		}
		return l
	}
	let {className: c} = l,
		navigationPreviewMedia = useRPStore((l) => l.navigationPageItemData),
		navigationPreviewMediaByKey = useRPStore((l) => l.navigationPreviewMediaByKey),
		navigationPreviewMediaKey = useRPStore((l) => l.navigationPageItemKeys),
		navigationPageItemSelected = useRPStore((l) => l.navigationPageItemSelected),
		navIsOpen = useRPStore((l) => l.navIsOpen),
		currentStateRef = useRef<boolean>(false),
		previewRef = useRef(null),
		windowResize = useWindowResize(),
		previewItems = useRef<PreviewItem[]>([]),
		selectedItemIndex = useRef<string | -1>(-1),
		{isMobile} = useIsMobile(),
		fallbackRef = useRef<PreviewItem>(null!),
		R = (function (l) {
			let c = {
					...defaultConfig,
				},
				[lastTimeout, setLastTimeout] = useState(0)
			return (
				useEffect(() => {
					let toID: null | ReturnType<typeof setTimeout> = null

					function handleVisibilityChange() {
						toID && clearTimeout(toID),
							(toID = setTimeout(() => {
								setLastTimeout(Date.now())
							}, c.debounce))
					}

					return (
						window.removeEventListener('visibilitychange', handleVisibilityChange),
							window.addEventListener('visibilitychange', handleVisibilityChange),
							() => {
								window.removeEventListener('visibilitychange',
									handleVisibilityChange)
							}
					)
				}, [c.debounce]),
					lastTimeout
			)
		})(),
		{currentPageKey} = useCurrentPage(),
		hasSomethingToShow =
			!!navigationPreviewMediaByKey[navigationPageItemSelected] || !!currentPageKey
	useEffect(() => {
		currentStateRef.current = navIsOpen
	}, [navIsOpen])

	const showPreviewCallback = useCallback(() => {
		gsap.set(previewRef.current, {
			autoAlpha: 1,
		})
	}, [navIsOpen, previewRef, y.in])
	const previewSizingCallback = useCallback(() => {
		let l = {
			scale: 1,
			y: window.innerHeight,
			duration: navIsOpen ? 1.2 : 0,
		}
		if (isMobile) {
			let c = getDefaultSizingValues()
			if (!c) return l
			let d = window.innerHeight,
				h = d / c.height,
				p = d - c.height
			h < 1 && (h = 1),
				(l = {
					scale: h,
					y: 0 + 0.5 * p + window.innerHeight + 50,
					duration: navIsOpen ? 1.2 : 0,
				})
		}
		return l
	}, [isMobile])
	const resetPreview = useCallback(() => {
		if (!previewRef.current) return
		let l = previewSizingCallback() || {}
		gsap.killTweensOf(previewRef.current)
		gsap[navIsOpen ? 'to' : 'set'](previewRef.current, {
			...l,
			duration: navIsOpen ? 1 : 0,
			delay: navIsOpen ? 0.2 : 0,
		})
	}, [previewSizingCallback])
	let H = useCallback(() => {
		if (!previewRef.current) return
		let l = getDefaultSizingValues() || {}
		gsap.killTweensOf(previewRef.current)
		gsap.to(previewRef.current, {
			...l,
			duration: y.in,
			delay: navIsOpen ? 0.2 : 0,
			ease: 'Power4.easeInOut',
		})
	}, [previewRef, getDefaultSizingValues, y])
	const showPreviewAfterResizeCallback = useCallback(() => {
		if (!previewRef.current) return
		gsap.killTweensOf(previewRef.current)
		const onComplete = () => {
			fallbackRef.current && fallbackRef.current.setVisibility(),
				previewItems.current.forEach((l) => {
					l.resetElement()
				}),
				showPreviewCallback()
		}
		if (isMobile) {
			let l = previewSizingCallback()
			gsap.to(previewRef.current, {
				scale: l.scale,
				y: l.y,
				duration: 1.2,
				delay: navIsOpen ? 0.2 : 0,
				ease: 'Power4.easeInOut',
				onComplete: onComplete,
			})
		} else {
			gsap.to(previewRef.current, {
				y: window.innerHeight,
				scale: 1,
				delay: navIsOpen ? 0.2 : 0,
				duration: 1.2,
				ease: 'Power4.easeInOut',
				onComplete: onComplete,
			})
		}
	}, [isMobile, previewSizingCallback, showPreviewCallback, previewRef, fallbackRef,
		previewItems])
	let hidePreviewCallback = useCallback(() => {
		gsap.to(previewRef.current, {
			autoAlpha: 0,
			duration: 0.4,
			onComplete: () => {
				resetPreview(),
				fallbackRef.current && fallbackRef.current.resetElement(),
					previewItems.current.forEach((l) => {
						l.resetElement()
					}),
					showPreviewCallback()
			},
		})
	}, [resetPreview, showPreviewCallback, previewRef, fallbackRef, previewItems])
	let selectionChangeShowCallback = useCallback(() => {
		if (!previewRef.current) return
		gsap.killTweensOf(previewRef.current)
		const onComplete = () => {
			fallbackRef.current && fallbackRef.current.setVisibility(),
				previewItems.current.forEach((l) => {
					l.resetElement()
				}),
				showPreviewCallback()
		}
		if (isMobile) {
			let l = getDefaultSizingValues()
			if (!l) return
			let c = window.innerHeight,
				d = c - l.height,
				h = previewSizingCallback()
			gsap.to(previewRef.current, {
				scale: h.scale,
				y: 0 + 0.5 * d,
				delay: navIsOpen ? 0.2 : 0,
				duration: 1.2,
				ease: 'Power4.easeInOut',
				onComplete: () => {
					gsap.to(previewRef.current, {
						y: h.y,
						duration: 1.2,
						ease: 'Power4.easeInOut',
					})
				},
			})
		} else {
			gsap.to(previewRef.current, {
				scale: 1,
				delay: navIsOpen ? 0.2 : 0,
				duration: 1.2,
				ease: 'Power4.easeInOut',
				onComplete: () => {
					gsap.to(previewRef.current, {
						y: window.innerHeight,
						duration: 1.2,
						ease: 'Power4.easeInOut',
						onComplete: onComplete,
					})
				},
			})
		}
	}, [isMobile, previewRef, previewSizingCallback, showPreviewCallback, fallbackRef,
		previewItems])

	useEffect(() => {
		navIsOpen
			? H()
			: (resetPreview(),
			fallbackRef.current && fallbackRef.current.resetElement(),
				previewItems.current.forEach((l) => {
					l.resetElement()
				}),
				showPreviewCallback())
	}, [resetPreview, R, H, showPreviewCallback])
	useEffect(() => {
		navIsOpen && H(),
		(selectedItemIndex.current !== navigationPageItemSelected &&
			-1 !== navigationPageItemSelected) ||
		navIsOpen ||
		(!!navigationPreviewMediaByKey[navigationPageItemSelected] || !!currentPageKey
			? showPreviewAfterResizeCallback()
			: hidePreviewCallback())
	}, [
		windowResize,
		resetPreview,
		navIsOpen,
		H,
		showPreviewAfterResizeCallback,
		navigationPageItemSelected,
		hasSomethingToShow,
		hidePreviewCallback,
	])
	const setHoveredNavItem = useRPStore((l) => l.setNavigationPageItemHovered)
	// useEffect(() => {
	//   navigationPageItemSelected !== -1 &&
	//     selectedItemIndex.current !== navigationPageItemSelected &&
	//     ((selectedItemIndex.current = navigationPageItemSelected),
	//     !!navigationPreviewMediaByKey[navigationPageItemSelected] || !!currentPageKey
	//       ? selectionChangeShowCallback()
	//       : hidePreviewCallback())
	// }, [
	//   navigationPageItemSelected,
	//   selectionChangeShowCallback,
	//   hasSomethingToShow,
	//   hidePreviewCallback,
	// ])

	return (
		<div ref={previewRef} className={cn('menu__preview-preview', c)} style={{
			visibility: navIsOpen ? 'visible' : 'hidden',
		}}>
			<VGradient />
		</div>
	)
}

const Temp = () => {
	//
	// return (  {fallbackMedia && (
	//   <MediaPreviewItem
	//     ref={fallbackRef}
	//     mediaSrcToUse={fallbackMedia[isMobile ? 'mobile' : 'desktop']}
	//     pageKey="default"
	//   />
	// )}
	// {navigationPreviewMedia.map((l, index) => {
	//   return (
	//     <MediaPreviewItem
	//       key={l.id + '' + index}
	//       ref={(el) => {
	//         el && (previewItems.current[index] = el)
	//       }}
	//       pageKey={navigationPreviewMediaKey[index]}
	//       mediaSrcToUse={
	//         l.previewMedia?.[isMobile ? 'mobile' : 'desktop'] ??
	//         fallbackMedia?.[isMobile ? 'mobile' : 'desktop'] ??
	//         ''
	//       }
	//     />
	//   )
	// })})
}
