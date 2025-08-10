"use client";

import React, {useEffect, useMemo, useRef} from "react";
import {useHeaderTheme} from "@/providers/HeaderTheme";
import {RPage} from "@/components/UX/Transition";
import {Media, User, UserMedia} from "@/payload-types";
import {useMenu, useRPStore, useRPTransition} from "@/providers/RP_Pro";

const PageClient = (props: {
	user: Pick<
		User,
		| "bio"
		| "role"
		| "updatedAt"
		| "createdAt"
		| "email"
		| "slug"
		| "displayUsername"
		| "name"
		| "firstName"
		| "location"
		| "lastName"
		| "image"
	> & {
		portrait: UserMedia | Media | null;
	};
	children: React.ReactNode;
}) => {
	/* Force the header to be dark mode while we have an image behind it */
	const {user} = props;
	const pageSlug = useMemo(() => [`@${user?.slug ?? "f"}`], [user]);
	const {setHeaderTheme} = useHeaderTheme();
	const setHeaderTransition = useRPStore((l) => l.setHeaderTransition);
	const setFrame = useMenu((l) => l.setFrame);
	const frameDim = useMemo(
		() => ({
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		}),
		[],
	);
	const showFXFrames = useRPStore((r) => r.setFXFrameVisibility);
	const exitCallback = useRef<string>(null!);
	const navIsOpen = useRPStore((r) => r.navIsOpen);
	const resetFrames = useMenu((l) => l.resetFrames);
	const onExitComplete = useRPTransition((r) => r.onLeavingStart);
	const setHeaderVisibility = useRPStore((l) => l.setHeaderVisibility);
	useEffect(() => {
		setHeaderTheme("dark");
		setHeaderTransition("slide");
		setHeaderVisibility(false);
	}, [setHeaderTheme, setHeaderVisibility]);
	useEffect(() => {
		navIsOpen ? resetFrames() : setFrame(frameDim);
		setHeaderVisibility(navIsOpen);
		!navIsOpen && showFXFrames(true);
		return () => {
			resetFrames();
			showFXFrames(true);
		};
	}, [navIsOpen]);

	useEffect(() => {
	}, []);

	return (
		<RPage type="users" slug={pageSlug} headerVisibility={false}>
			{props.children}
		</RPage>
	);
};

export default PageClient;
