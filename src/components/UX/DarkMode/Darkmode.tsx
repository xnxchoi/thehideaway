'use client'
import {useRPStore} from '@/providers/RP_Pro'
import {useCallback, useEffect, useRef, type ComponentPropsWithRef} from 'react'
import {SvgIco} from '@/components/UX/svgIco'
import gsap from 'gsap'
import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {useTheme} from '@/providers/Theme'
import {Theme} from '@/providers/Theme/types'
import {useVoyageur} from '@/stores/Routing/RP_Voyageur'

type ElementTypMap = HTMLElementTagNameMap &
	Pick<SVGElementTagNameMap, Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>>
type ElementTyp = ElementTypMap[keyof ElementTypMap]
type TargetTagMap = Pick<
	ElementTypMap,
	'svg' | 'circle' | 'span' | 'div' | 'button' | 'rect' | 'path'
>
type TargetElementType = TargetTagMap[keyof TargetTagMap]

function isOneOf(c: ElementTyp): c is TargetElementType {
	if (
		c instanceof HTMLElement ||
		c instanceof HTMLSpanElement ||
		c instanceof SVGRectElement ||
		c instanceof SVGSVGElement ||
		c instanceof SVGPathElement ||
		c instanceof HTMLDivElement ||
		c instanceof HTMLButtonElement ||
		c instanceof SVGCircleElement
	)
		return true as const
	return false as const
}

export const DarkmodeButton = (props: ComponentPropsWithRef<'button'>) => {
	const navIsOpen = useRPStore((l) => l.navIsOpen)
	const theme = useTheme((r) => r.theme)
	const togggleTheme = useTheme((r) => r.toggleTheme)
	const locked = useTheme((r) => r.locked)
	const {ref: btRef} = props
	const vice: Theme = theme === 'light' ? 'dark' : 'light'
	const H = 0.3
	const lightmodeIcon = useRef<HTMLSpanElement>(null!),
		darkmodeIcon = useRef<HTMLSpanElement>(null!)
	const toRef = useRef<ReturnType<typeof setTimeout>>(null!)

	const is404 = useVoyageur((l) => l.is404),
		isHome = useVoyageur((r) => r.isHome)
	const animateAllComponents = function (reset: boolean = false) {
		const targetNodes = document.querySelectorAll('[data-themed]')
		const targets: Array<TargetElementType> = []
		for (let l = 0; l < targetNodes.length; l++) {
			targets.push(targetNodes[l] as TargetElementType)
		}
		for (const c of targets) {
			if (isOneOf(c)) {
				if (!c) return
				if (reset) {
					c.style.removeProperty("transition")
					continue
				}
				if (!c.dataset.themed) return
				const d = c.dataset.themed.split(",")
				c.style.transition = d.map((l) => "".concat(l, " ").concat("" + H, "s")).join(",")
			}
		}
	}
	const iconTransitioner = useCallback((l: string, c = false) => {
		if (!lightmodeIcon.current || !darkmodeIcon.current) return
		gsap.killTweensOf([lightmodeIcon.current, darkmodeIcon.current])
		const d = "Power3.easeOut"
		gsap[c ? 'set' : 'to'](lightmodeIcon.current, {
			y: 'light' === l ? 0 : '-105%',
			duration: H,
			ease: d,
		}),
			gsap[c ? 'set' : 'to'](darkmodeIcon.current, {
				y: 'light' === l ? '105%' : 0,
				duration: H,
				ease: d,
			})
	}, [])
	useEffect(() => {
		theme && iconTransitioner(theme)
	}, [theme, iconTransitioner])
	useEffect(() => {
		theme &&
		(toRef.current && clearTimeout(toRef.current),
			animateAllComponents(),
			(toRef.current = setTimeout(() => {
				animateAllComponents(!0)
			}, 1100 * H)))
	}, [theme])

	useEffect(() => {
		if (!btRef) return
		gsap.killTweensOf(btRef)
		const shouldShut5 = (isHome || is404) && !navIsOpen
		gsap.to(btRef, {
			autoAlpha: shouldShut5 ? 0 : 1,
			zIndex: shouldShut5 ? 0 : 248,
		})
	}, [isHome, is404])
	return (
		<Button className={cn("circ-bt theme-toggle-btn", {hover: navIsOpen})} ref={btRef}
		        data-themed="background-color,border-color,color"
		        aria-label={`Switch to ${vice} mode.`} onClick={() => !locked && togggleTheme()}>
      <span className={cn("theme-toggle-icon-container")} ref={lightmodeIcon}>
        <SvgIco className="toggle-icon-svg-light" viewBox="0 0 12 12" paths={[
	        [
		        "M1.39091 9.86727L2.16 10.6364L3.14182 9.66L2.36727 8.88546M6 2.72727C4.19455 2.72727 2.72727 4.19455 2.72727 6C2.72727 7.80545 4.19455 9.27273 6 9.27273C7.80545 9.27273 9.27273 7.80545 9.27273 6C9.27273 4.18909 7.80545 2.72727 6 2.72727ZM10.3636 6.54545H12V5.45455H10.3636M8.85818 9.66L9.84 10.6364L10.6091 9.86727L9.63273 8.88546M10.6091 2.18182L9.84 1.41818L8.85818 2.39455L9.63273 3.16909M6.54545 0H5.45455V1.63636H6.54545M3.14182 2.39455L2.16 1.41818L1.39091 2.18182L2.36727 3.16909L3.14182 2.39455ZM0 6.54545H1.63636V5.45455H0M6.54545 10.3636H5.45455V12H6.54545",
		        {fill: "oklch(var(--n-s-btn)/1)"},
	        ],
        ]} />
      </span>
			<span className={cn("theme-toggle-icon-container", "toggle-icon-svg-lights")}
			      ref={darkmodeIcon}>
        <SvgIco className="toggle-icon-svg-dark" viewBox="0 0 7 10" paths={[
	        [
		        "M0.333986 9.71549C2.27597 9.0291 3.66732 7.17703 3.66732 5C3.66732 2.82297 2.27597 0.970903 0.333984 0.284509C0.855283 0.100257 1.41626 0 2.00065 0C4.76207 0 7.00065 2.23858 7.00065 5C7.00065 7.76142 4.76207 10 2.00065 10C1.41626 10 0.855285 9.89974 0.333986 9.71549Z",
		        {
			        fill: "oklch(var(--n-s-btn)/1)",
			        fillRule: "evenodd",
			        clipRule: "evenodd",
		        },
	        ],
        ]} />
      </span>
		</Button>
	)
}
