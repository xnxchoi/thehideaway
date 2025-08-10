'use client'
import {useRPStore} from '@/providers/RP_Pro'
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {createStore, useStore} from 'zustand'
import {randomNumber} from "./randomNumber"
import tabMessages from '@/constants/tabMessages.json'

function rand(min: number, max: number) {
	const minCeiled = Math.ceil(Math.min(min, max))
	const maxFloored = Math.floor(Math.max(min, max))
	return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}

type TabMessageStore = {
	title: string
	screenSaverTitle: string
	emojis: string[]
	messages: string[]
}
type TabMessageActions = {
	setTitle: (title: string) => void
	setScreenSaverTitle: (title: string) => void
	setEmojis: (emojis: string[]) => void
	setMessages: (messages: string[]) => void
}
type TabMessengerType = TabMessageStore & TabMessageActions
const createTabMessageStore = (initState: TabMessageStore) => {
	return createStore<TabMessengerType>((set) => ({
		...initState,
		setTitle: (title) => set({title}),
		setScreenSaverTitle: (title) => set({screenSaverTitle: title}),
		setEmojis: (emojis) => set({emojis}),
		setMessages: (messages) => set({messages}),
	}))
}
type TabMessengerAPI = ReturnType<typeof createTabMessageStore>
const tabMessageContext = createContext<TabMessengerAPI | undefined>(undefined)
const TabMessengerProvider = ({children}: { children: React.ReactNode }) => {
	const store = useRef<TabMessengerAPI>(undefined!)


	if (!store.current) {
		store.current = createTabMessageStore({
			title: '',
			screenSaverTitle: '',
			emojis: tabMessages.icons,
			messages: tabMessages.messages
		})

	}


	return <tabMessageContext.Provider value={store.current}>{children}</tabMessageContext.Provider>
}
export const useTabMessenger = <T, >(selector: (store: TabMessengerType) => T): T => {
	const store = useContext(tabMessageContext)
	if (!store) {
		throw new Error('useTabMessenger must be used within a TabMessengerProvider')
	}
	return useStore(store, selector)
}
const InternalTabMessenger = ({children}: { children: React.ReactNode }) => {
	const FALLBACK_TITLE = 'THE HIDEAWAY'
	const emojis = useTabMessenger((store) => store.emojis)
	const messages = useTabMessenger((store) => store.messages)
	const title = useTabMessenger((store) => store.title)
	const setTitle = useTabMessenger((store) => store.setTitle)
	const screenSaverTitle = useTabMessenger((store) => store.screenSaverTitle)
	const setScreenSaverTitle = useTabMessenger((store) => store.setScreenSaverTitle)

	const [visible, setVisible] = useState(true)

	const visibleCallback = useCallback(() => {
		setVisible(!document.hidden)
	}, [setVisible])


	useEffect(() => {
		setTitle(document.title)
		setScreenSaverTitle(FALLBACK_TITLE)
		document.addEventListener('visibilitychange', visibleCallback)
		return () => {
			document.removeEventListener('visibilitychange', visibleCallback)
		}
	}, [])
	const visibleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => {
		if (!emojis || !messages) return
		if (emojis.length > 0 && messages.length > 0) {
			setScreenSaverTitle(
				`${emojis[randomNumber(0, emojis.length - 1)]}   ${messages[randomNumber(0,
					messages.length - 1)]}`)
		}
	}, [visible])
	useEffect(() => {
		if (visible) {
			visibleTimeout.current && clearTimeout(visibleTimeout.current)
			visibleTimeout.current = null
			document.title = title
		} else {
			visibleTimeout.current && clearTimeout(visibleTimeout.current)

			visibleTimeout.current = setTimeout(() => {
				document.title = screenSaverTitle
			}, 1500)
		}
	}, [title, screenSaverTitle, visible])
	return <>{children}</>
}
export const TabMessenger = ({children}: { children: React.ReactNode }) => {
	return (
		<TabMessengerProvider>
			<InternalTabMessenger>{children}</InternalTabMessenger>
		</TabMessengerProvider>
	)
}
