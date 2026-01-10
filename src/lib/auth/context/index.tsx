"use client";

import type {
	BetterPaidAccount,
	BetterPaidBaseSession,
	BetterPaidDeviceSession
} from "@/lib/auth/types";
import type {TypedUser} from "payload";
import {createContext, ReactNode, useContext} from "react";

type UserContextType = {
	sessionPromise: Promise<BetterPaidBaseSession | null>;
	userAccountsPromise: Promise<BetterPaidAccount[] | null>;
	deviceSessionsPromise: Promise<BetterPaidDeviceSession[] | null>;
	currentUserPromise: Promise<TypedUser | null>;
};

const BetterAuthContext = createContext<UserContextType | null>(null);

export function useBetterAuth(): UserContextType {
	const context = useContext(BetterAuthContext);
	if (context === null) {
		throw new Error("useBetterAuth must be used within a BetterAuthProvider");
	}
	return context;
}

export function BetterAuthProvider({
	                                   children,
	                                   sessionPromise,
	                                   userAccountsPromise,
	                                   deviceSessionsPromise,
	                                   currentUserPromise,
                                   }: {
	children: ReactNode;
	sessionPromise: Promise<BetterPaidBaseSession | null>;
	userAccountsPromise: Promise<BetterPaidAccount[] | null>;
	deviceSessionsPromise: Promise<BetterPaidDeviceSession[] | null>;
	currentUserPromise: Promise<TypedUser | null>;
}) {
	return (
		<BetterAuthContext.Provider value={{
			sessionPromise,
			userAccountsPromise,
			deviceSessionsPromise,
			currentUserPromise,
		}}>
			{children}
		</BetterAuthContext.Provider>
	);
}
