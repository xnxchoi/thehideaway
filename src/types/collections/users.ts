import type {User} from "@payload-types";

export const enforceUserFields = () => ({
	name: true,
	slug: true,
	image: true,
	// verified: true,
}) as const;
const forceUserFieldSelect = {
	name: true,
	slug: true,
	// verified: true,
	image: true,
} as const;
type UserDefinitiveFieldKeys = keyof typeof forceUserFieldSelect;
export type UserOverviewSelect = Record<UserDefinitiveFieldKeys, true>
export const userOverviewSelect = (): UserOverviewSelect => ({
	name: true,
	slug: true,
	// verified: true,
	image: true,
})
export type AuthorOverview = Pick<
	User,
	"id" | UserDefinitiveFieldKeys
>;
export type UserOverview = AuthorOverview;
export type RelUser = AuthorOverview | string;
export type RelAuthor = RelUser;
export type AuthorSingle = AuthorOverview;
export type FocusedUser = AuthorOverview;