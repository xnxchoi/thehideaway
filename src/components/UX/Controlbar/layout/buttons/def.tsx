'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

import {
	ControllerButton,
	MenuButtonProps,
} from '@/components/UX/Controlbar/layout/buttons/controllerButton'
import {useRPStore} from '@/providers/RP_Pro'

import gsap from 'gsap'

export const DefButtons = (props: {
	handleButtonChange?: { start?: () => void; end?: () => void }
}) => {
	const {handleButtonChange} = props
	const setMenu = useRPStore((store) => store.setCBmenu)
	const btn1 = useRef(null)
	const btn2 = useRef(null)
	const btn3 = useRef(null)
	const ref = useRef<HTMLUListElement>(null!)
	const [defaultWidth, setDefaultWidth] = useState(0)
	useEffect(() => {
		setDefaultWidth(ref.current.clientWidth)
	})
	const onButtonChangeStart = useCallback(() => {
		gsap.set(ref.current, {
			width: defaultWidth,
			overflow: 'hidden',
		})
	}, [ref, setDefaultWidth])
	const onButtonChangeEnd = useCallback(() => {
		gsap.fromTo(
			ref.current,
			{
				width: defaultWidth,
			},
			{
				width: '100%',
				duration: 0.4,
				ease: 'Power4.easeInOut',
			},
		)
	}, [defaultWidth, ref])
	const defaultBts = {
		btn1: {
			el: {},
			'data-action': 'open',
			'data-target': 'search',
			paths: [
				{
					d: 'M15.75 7.031a4.781 4.781 0 0 1-4.781 4.782 4.781 4.781 0 0 1-4.781-4.782 4.781 4.781 0 0 1 9.562 0zM2.25 15.75l5.625-5.625',
					fill: 'none',
					stroke: 'currentColor',
					strokeMiterlimit: 10,
					strokeWidth: 1.125,
				},
			],
			width: 22,
			height: 22,
			viewBox: '0 0 18 18',
			label: '검색하기',
			title: 'SEARCH',
			onClick: () => setMenu('search'),
		},
		btn2: {
			label: '체크인.',
			title: 'CHECK IN',
			className: 'js-login-init',
			'data-action': 'open',
			'data-tab': 'login',
			'data-target': 'loginModal',
			href: '/admin',
			el: {},
		},
		btn3: {
			style: {display: 'none'},
			el: {},
		},
	}
	const [btn1Content, setBtn1Content] = useState<MenuButtonProps<any>>(defaultBts.btn1)
	const [btn2Content, setBtn2Content] = useState<MenuButtonProps<any>>(defaultBts.btn2)
	const [btn3Content, setBtn3Content] = useState<MenuButtonProps<any>>(defaultBts.btn3)

	const switchBtns = useCallback(() => {
		setBtn2Content(
			user
				? {
					label: '새로운 기록.',
					title: '새로운 기록.',
					el: {},
					icon: {
						width: 20,
						height: 20,
						viewBox: '0 0 15 15',
						fill: 'none',
						paths: [{d: 'M7.5 1v13M1 7.5h13', stroke: 'currentColor'}],
					},
					'data-action': 'open',
					'data-target': 'write',
					'data-post-author': user?.id,
					onClick: () => setMenu('write'),
				}
				: defaultBts.btn2,
		)
		setBtn3Content(
			user
				? {
					title: '프로필',
					label: '게시글 관리',
					href: '/suite/publications/',
					icon: {
						width: 20,
						height: 20,
						viewBox: '-0.013 0 0.625 0.625',
						fill: 'none',
						paths: [
							{
								d: 'M.3.327a.113.113 0 1 0 0-.226.113.113 0 0 0 0 .226ZM.225.298H.224',
								stroke: 'currentColor',
								strokeMiterlimit: 10,
								strokeLinecap: 'round',
								strokeLinejoin: 'round',
								strokeWidth: 0.025,
							},
							{
								d: 'M.424.321a.237.237 0 0 1 .113.19.013.013 0 0 1-.013.013H.075A.013.013 0 0 1 .062.511.238.238 0 0 1 .174.322',
								stroke: 'currentColor',
								strokeMiterlimit: 10,
								strokeLinecap: 'round',
								strokeLinejoin: 'round',
								strokeWidth: 0.025,
							},
						],
					},
					el: {},
				}
				: defaultBts.btn3,
		)
	}, [setBtn3Content, setBtn2Content, defaultBts, user])
	const gsapTL = useRef(
		gsap.timeline({
			defaults: {
				ease: 'Power4.easeInOut',
				duration: 0.4,
			},
		}),
	)
	const lastUser = useRef(user)
	useEffect(() => {
		if (user !== lastUser.current) {
			lastUser.current = user
			gsapTL.current.to(ref.current, {
				autoAlpha: 0,
				duration: 0.4,
			}).to(
				ref.current,
				{
					width: defaultWidth,
					overflow: 'hidden',
					duration: 0.4,
					onStart: () => switchBtns(),
				},
				'-=0.2',
			).to(ref.current, {
				duration: 0.5,
				width: '100%',
				overflow: 'auto',
			}).to(
				ref.current,
				{
					autoAlpha: 1,
					duration: 0.4,
				},
				'-=0.2',
			).set(ref.current, {
				clearProps: 'all',
			})
		}
		return () => {
			gsapTL.current.kill()
		}
	}, [user])

	return (
		<ul className="menu-float__nav" ref={ref} {...props}>
			<ControllerButton {...btn1Content} ref={btn1} />
			<ControllerButton {...btn2Content} ref={btn2} />
			<ControllerButton {...btn3Content} ref={btn3} />
		</ul>
	)
}
