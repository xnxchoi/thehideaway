"use client";
import {useCursorStore, useRPStore} from "@/providers/RP_Pro";
import {useCallback} from "react";
import {PageTransitionType} from "@/components/UX/Transition";

export const useTransitionSetter = function () {
	const setTransitionOutType = useRPStore((l) => l.setTransitionOutType);
	const setTransitionWipe = useRPStore((l) => l.setIsTransitioningWipe);

	const isNavOpen = useRPStore((l) => l.navIsOpen);
	const setCurs = useCursorStore((l) => l.setCursorState);
	const setGenericPageTransition = useCallback(
		(params: { transitionType?: PageTransitionType }) => {
			const {transitionType = "FADE"} = params;
			(setTransitionOutType(isNavOpen ? "FROM_MENU" : transitionType),
			isNavOpen || setTransitionWipe(false),
				setCurs(null));
		},
		[setTransitionOutType, setTransitionWipe, isNavOpen],
	);

	return {
		setGenericPageTransition,
	};
};
