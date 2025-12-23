"use client";

import type {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {createContext, type ReactNode, useContext, useEffect, useState} from "react";

export type CourierForm = {
	form: FormData; relationTo: ImageCollectionSlug; value?: string;
};
type CourierStatus = "pending" | "uploading" | "failed" | "idle";
type CourierState = {
	status: CourierStatus; savingState: boolean; buttonRef: HTMLButtonElement | null;
};
type CourierActions = {
	setStatus: (status: CourierStatus) => void;
	setSavingState: (savingState: boolean) => void;
	setButtonRef: (ref: HTMLButtonElement | null) => void;
};
type Courier = CourierState & CourierActions;
const CourierContext = createContext<Courier | null>(null);
type CourierProviderProps = {
	children: ReactNode;
};
export const CourierProvider = (props: CourierProviderProps) => {
	const [status, setStatus] = useState<CourierStatus>("idle");
	const [savingState, setSavingState] = useState<boolean>(false);
	const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
	useEffect(() => {
		return () => {
			setStatus("idle");
			setSavingState(false);
			setButtonRef(null);
		};
	}, []);
	return (<CourierContext.Provider value={{
			status, setStatus, savingState, setSavingState, buttonRef, setButtonRef
		}}>
			{props.children}
		</CourierContext.Provider>);
};
export const useCourier = <T, >(selector: (store: Courier) => T) => {
	const context = useContext(CourierContext);
	if (!context) {
		throw new Error("useCourier must be used within a CourierProvider");
	}
	return selector(context);
};
