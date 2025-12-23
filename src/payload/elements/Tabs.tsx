"use client"
import {cn} from "@/lib/utils"
import {Tabs} from "@base-ui/react"
import type {ComponentProps, ReactNode} from "react"

const TabsRoot = ({
	                  children,
	                  defaultValue,
	                  value,
	                  onValueChange
                  }: ComponentProps<typeof Tabs.Root>) => {
	return <Tabs.Root
		value={value}
		onValueChange={onValueChange}
		data-themed={"border-color, color, background-color"}
		className={"relative w-[540px] max-w-[calc(100vw-24%)] rounded-lg bg-muted-faded-background/10 px-1 pt-0 pb-4 outline outline-muted-faded-foreground/20 backdrop-blur-sm dark:outline-muted-faded-foreground/40!"}
		defaultValue={defaultValue}
	>{children}</Tabs.Root>
}
const TabsList = ({children, slots, ref, ...rest}: ComponentProps<typeof Tabs.List> & {
	slots?: ReactNode
}) => {
	return <div
		className={"flex w-full items-center justify-between px-4 shadow-[inset_0_-1px] shadow-muted-faded-foreground/20"}
		data-themed={"border-color, color, background-color,box-shadow"}
	>
		<Tabs.List
			ref={ref}
			className={"rounded-0 rounded-0 relative flex shrink-0 grow items-center gap-1 px-1 py-2 text-sm!"}
			{...rest}
		>{children}
		</Tabs.List>{slots}</div>
}
const Tab = ({children, value, ref, ...rest}: ComponentProps<typeof Tabs.Tab>) => {
	return <Tabs.Tab
		className={"appearance-none border-none bg-transparent px-[8px] py-[4px] break-keep whitespace-nowrap text-muted-faded-foreground/50 transition-colors duration-250 ease-out-power3 outline-none before:inset-x-0 before:inset-y-1 before:rounded-sm before:-outline-offset-1 hover:text-muted-faded-foreground focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-1 data-[active]:text-foreground"}
		data-themed={"color, background-color, border-color, outline-color"}
		ref={ref}
		value={value}
		{...rest}>
		{children}
	</Tabs.Tab>
}
const TabIndicator = ({className, ref, ...rest}: ComponentProps<typeof Tabs.Indicator>) => {
	return <Tabs.Indicator
		className={cn("absolute -bottom-px left-0 z-[-1] h-px w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 overflow-hidden rounded-[0.25px] bg-foreground transition-all duration-200 ease-in-out", className)}
		data-themed={"color, background-color, border-color, outline-color"}
		ref={ref}
		{...rest} />
}

const TabPanel = ({
	                  className, children, value, ...props
                  }: ComponentProps<typeof Tabs.Panel>) => {
	return (
		<Tabs.Panel
			{...props}
			className={cn(
				"relative flex h-32 min-h-0 grow items-center justify-center overflow-x-hidden overflow-y-auto mask-[linear-gradient(black_0%,black_calc(100%-34px),transparent_100%)] -outline-offset-1 data-hidden:hidden",
				className
			)}
			value={value}
		>
			{children}
		</Tabs.Panel>
	)
}
export {TabsRoot, TabsList, Tab, TabIndicator, TabPanel}
