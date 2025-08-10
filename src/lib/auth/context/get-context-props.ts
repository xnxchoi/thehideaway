import {
	currentUser,
	getDeviceSessions,
	getSession,
	getUserAccounts,
} from "@/lib/auth/context/servers";

export const getContextProps = () => {
	const sessionPromise = getSession();
	const userAccountsPromise = getUserAccounts();
	const deviceSessionsPromise = getDeviceSessions();
	const currentUserPromise = currentUser();
	return {
		sessionPromise,
		userAccountsPromise,
		deviceSessionsPromise,
		currentUserPromise,
	};
};
