'use client'
import {useRouter} from 'next/navigation'
import {useTransitionSetter} from '@/components/UX/Transition/transitionSetter'
import {PageType, LayoutType} from '@/stores/Routing/RP_Voyageur'
import {pathToRegexp} from "path-to-regexp"


export const usePageNavigation = function ({page}: { page: string }) {
	const router = useRouter()
	const {setGenericPageTransition} = useTransitionSetter()
	setGenericPageTransition({}),
		setTimeout(() => {
			router.push(page, {scroll: !1})
		}, 40)
}
export const StaticPathToPageMap: Record<string, {
	pageType: PageType,
	layoutType: LayoutType,
	slug: string
}> = {
	'/': {pageType: 'pages', layoutType: 'page', slug: 'home'},
	'/users': {pageType: 'users', layoutType: 'archive', slug: 'users'},
	'/posts': {pageType: 'posts', layoutType: 'archive'},
	'/archives': {pageType: 'archives', layoutType: 'archive'},
	'/posts/:post': {pageType: 'posts', layoutType: 'single'},
	'/delta': {pageType: 'delta', layoutType: 'page'},
	'/search': {pageType: 'search', layoutType: 'page'},
	'/account': {pageType: 'account', layoutType: 'page'},
	'/404': {pageType: '404', layoutType: 'page'},
}
const userPathTest = /(?<=(^\/(users\/|\@)))(([a-z0-9\.\_])){3,30}(?=((\/(users|delta))?$))/
export const PathToPageMap = (path: string) => {
	const userRoute = pathToRegexp('/users/:user', {
		sensitive: true
	})
	const postsPath = pathToRegexp('/posts/:post', {})
	const archivePath = pathToRegexp('/surf/:page', {})
	const homePath = pathToRegexp('/')


}