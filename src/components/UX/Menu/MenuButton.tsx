import gsap from 'gsap'
import {RefObject, useCallback, useEffect, useRef, useState} from 'react'

import {useRPStore} from '@/providers/RP_Pro'
import {cn} from '@/lib/utils'
import {Icon} from 'src/components/UX/Icon'
import {useIsMobile} from '@/providers/MiddleMan'
import {Button, type ButtonTotalProps} from '@/components/ui/button'
import type {ComponentPropsWithRef} from 'react'

type MenuButtonProps = ComponentPropsWithRef<'button'>
export const MenuButton = (props: ButtonTotalProps) => {
	const toggleNav = useRPStore((store) => store.toggleMenu)
	const isNavOpen = useRPStore((store) => store.navIsOpen)
	const menuTextRef: RefObject<null | HTMLElement> = useRef(null)
	const [buttonPaddingPx, setButtonPaddingPx] = useState('16')
	const closeTextRef: RefObject<null | HTMLElement> = useRef(null)
	const menuIconRef: RefObject<null | HTMLElement> = useRef(null)
	const {ref: menuRef} = props
	const x = useRef(!1)
	const {isMobile} = useIsMobile()
	useEffect(() => {
		setButtonPaddingPx(`${isMobile ? 14 : 16}`)
	}, [isMobile])
	const textSwitchCallback = useCallback((l: boolean) => {
		if (!menuTextRef.current || !closeTextRef.current || !menuIconRef.current || !menuRef) return
		const textWidth = isNavOpen ? closeTextRef.current.offsetWidth : menuTextRef.current.offsetWidth + 2
		gsap.killTweensOf([menuTextRef.current, menuIconRef.current, closeTextRef.current, menuRef])
		gsap[l ? 'set' : 'to'](menuRef, {
			width: parseInt(buttonPaddingPx, 10) * 4 + textWidth,
			duration: 0.6,
			ease: 'Power4.easeOut',
		}), gsap[l ? 'set' : 'to'](menuTextRef.current, {
			y: isNavOpen ? '-105%' : 0, duration: 0.6, ease: 'Power4.easeOut',
		}), gsap[l ? 'set' : 'to'](closeTextRef.current, {
			y: isNavOpen ? 0 : '105%', duration: 0.6, ease: 'Power4.easeOut',
		}), gsap[l ? 'set' : 'to'](menuIconRef.current, {
			y: isNavOpen ? 0 : '50%',
			duration: 0.6,
			ease: 'Power4.easeOut',
			delay: isNavOpen ? 0.075 : 0,
		})
	}, [isNavOpen])
	useEffect(() => {
		textSwitchCallback(false)
	}, [textSwitchCallback])
	useEffect(() => {
		x.current || ((x.current = !0), textSwitchCallback(true))
	}, [textSwitchCallback])
	return (<Button id="primary__nav" type="button" data-themed="border-color,background-color"
	                onClick={(e) => {
		                e.preventDefault()
		                toggleNav()
	                }} ref={menuRef}
	                className={cn('rp_btn', 'leading-[140%] tracking-[-0.01em] font-normal',
		                'menu__toggle', 'relative',
		                'overflow-hidden hover:bg-transparent! data-[state=true]:bg-transparent! data-[state=true]:border-[oklch(var(--n-s-bb)/1)]! hover:border-[oklch(var(--n-s-bb)/1)]! w-[64px] data-[state=true]:w-[77px] transition-all duration-300 ease-out-power3')}
	                data-state={isNavOpen} aria-label={`${isNavOpen ? 'Close' : 'Open'} The Menu`}>
    <span ref={menuTextRef} className="menu__button-text" data-themed="color" aria-hidden="false"
          data-toggle="ON">
      MENU
    </span>
		<span ref={closeTextRef} className="menu__button-close" aria-hidden="true">
      <span data-themed="color" data-toggle="OFF">
        BACK
      </span>
      <span className="menu__button-icon-container" ref={menuIconRef}>
        <Icon className={'menu__button-icon'} name={'Close'} />
      </span>
    </span>
	</Button>)
}
