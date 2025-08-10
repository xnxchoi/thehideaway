export const roleToAuthority = (role: 'user' | 'patron' | "author" | 'editor' | 'admin' | 'guest',
): number => {
	switch (role) {
		case 'user':
			return 1
		case "patron":
			return 2
		case "author":
			return 3
		case 'editor':
			return 4
		case 'admin':
			//Ensuring admin supersedes all cases
			return 1000
		case "guest":
			return 0
		default:
			return 0
	}
}
export const authorityToRole = (authority: number): Role => {
	switch (authority) {
		case 1:
			return "user";
		case 2:
			return "patron";
		case 3:
			return "author";
		case 4:
			return "editor";
		case 1000:
			return "admin";
		default:
			return "guest";
	}
};
export type Role = "user" | "patron" | "author" | "editor" | "admin" | "guest";
export const rolesToAuthority = (roles: Role[]): number => {
	return roles.reduce((acc, role) => {
		return Math.max(acc, roleToAuthority(role))
	}, 0)
}
