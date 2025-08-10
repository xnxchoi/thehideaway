'use client'
import {cn} from '@/lib/utils'
import {TopMenu} from '@/components/UX/Controlbar/top-menu'
import {BottomMenu} from '@/components/UX/Controlbar/bottom-menu'
import {useRPStore, useScroll} from "@/providers/RP_Pro";

export const FloatWrapper = () => {
	const scrollDir = useScroll((store) => store.scrollDirection);
	return (
		<div className={cn("menu-float__wrapper", {
			"is-open": cbOpen,
			"is-open-main": cbOpen,
		})} data-scroll-direction={scrollDir}>
			<TopMenu />
			<BottomMenu />
		</div>
	);
};
