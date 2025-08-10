import {Access, AccessArgs, Field, FieldAccess, Where} from "payload";

import type {
	Admin,
	Album,
	Delta,
	Media,
	Playlist,
	Post,
	Profile,
	Tag,
	Track,
	User,
	UserMedia,
} from "@/payload-types";
import {FieldAccessArgs} from "node_modules/payload/dist/fields/config/types";

type isAuthenticated = (args: AccessArgs<User> | AccessArgs<Admin>) => boolean;
type AuthorCollections =
	| Post
	| Delta
	| Media
	| Track
	| UserMedia
	| Playlist
	| Album
	| Profile
	| Tag;
type RP_Roles = NonNullable<User["role"]>;

export const checkRole = (
	role: RP_Roles,
	user: AccessArgs["req"]["user"],
): boolean => {
	if (!user) return false;
	if (user?.role === "admin") return true;

	return !!(user?.role === role);
};
export const isAdmin = ({
	req: {user},
}: AccessArgs<AuthorCollections>): boolean => {
	if (!user) return false;
	if (user?.role === "admin") return true;
	return false;
};
/**
 *  @function
 *
 *  Be one of : 'admin' | 'editor' |'author'
 *
 * @returns {boolean} Can be used for both {@link FieldAccess} and {@link Access} control.
 */
export const isWriter = ({
	req: {user},
}:
	| AccessArgs<AuthorCollections>
	| FieldAccessArgs<AuthorCollections>): boolean =>
	["admin", "editor", "author"].some((role) => role === user?.role);
/**
 *  @function
 *
 *  Be one of : 'admin' | 'editor'
 *
 * @returns {boolean} Can be used for both {@link FieldAccess} and {@link Access} control.
 */
export const isEditor = ({
	req: {user},
}:
	| AccessArgs<AuthorCollections>
	| FieldAccessArgs<AuthorCollections>): boolean =>
	["admin", "editor"].some((role) => role === user?.role);
/**
 *  @function
 *
 *  Be one of : 'admin' | 'editor'
 *
 * @returns {boolean} Can be used for both {@link FieldAccess} and {@link Access} control.
 */
export const isAdminOrEditor = ({
	req: {user},
}:
	| AccessArgs<AuthorCollections>
	| FieldAccessArgs<AuthorCollections>): boolean =>
	["admin", "editor"].some((role) => role === user?.role);
/**
 *  Collection accessor for read
 *  For collections with author properties
 *
 * @returns {Access} Collection access.
 */
export const standardReadAccess: Access<AuthorCollections> = ({
	req: {user},
}: AccessArgs<AuthorCollections>) => {
	if (!user)
		return {
			_status: {
				equals: "published",
			},
		};
	if (user?.role === "admin" || user?.role === "editor") return true;

	return {
		or: [
			{
				_status: {
					equals: "published",
				},
			},
			{
				author: {
					equals: user?.id,
				},
			},
		],
	} as Where;
};
/**
 *
 * Access control to check if current user is the author of a Collection item.
 *
 * Having Editor authority does **not** pass.
 * @see {@link isAuthorOrEditor} to allow editor access.
 * @returns {boolean}
 */
export const isAuthor = ({
	data,
	req: {user},
}:
	| FieldAccessArgs<AuthorCollections>
	| AccessArgs<AuthorCollections>): boolean => {
	if (!user) return false;

	if (user?.role === "admin") return true;
	if (data?.author) {
		if (Array.isArray(data.author)) {
			return (
				data.author.length > 0 &&
				(typeof data.author[0] === "string"
					? data.author.some((au) => au === user.id)
					: data.author.some((au) => (au as User).id === user.id))
			);
		} else if (data.author === user.id) return true;
	}
	return false;
};

/**
 *
 * Access control to check if current user is the author of a Collection item,
 * or has Editor authority.
 * @returns {boolean}
 */
export const isAuthorOrEditor = ({
	data,
	req: {user},
}:
	| FieldAccessArgs<AuthorCollections>
	| AccessArgs<AuthorCollections>): boolean => {
	if (!user) return false;
	if (!user.role) return false;
	if (user.role === "admin") return true;
	if (user.role === "editor") return true;
	if (data?.author) {
		if (Array.isArray(data.author)) {
			return (
				data.author.length > 0 &&
				(typeof data.author[0] === "string"
					? data.author.some((au) => au === user.id)
					: data.author.some((au) => (au as User).id === user.id))
			);
		} else if (data.author === user.id) return true;
	}
	return false;
};
/**
 *  Accessor for modifications
 *
 * @returns {Access}
 *
 *  For collections with author properties
 *
 *  Either be an admin/editor, or the author of the document
 *
 *  Collection access. For {@link Field} use {@link isAuthorOrEditor}
 */
export const standardUpdateAccess: Access<AuthorCollections> = ({
	req,
}: AccessArgs<AuthorCollections>) => {
	const user = req.user;
	if (!user || !user.role) return false;
	if (user?.role === "admin") return true;
	if (user?.role === "editor") return true;
	return {
		author: {
			equals: user.id,
		},
	};
};
/**
 * Accessor for creation
 *
 * Either be an admin, editor, or author
 *
 * @returns {boolean}
 * for use in both {@link Field} and collections
 *

 */
export const standardCreateAccess = ({
	req: {user},
}:
	| AccessArgs<AuthorCollections>
	| FieldAccessArgs<AuthorCollections>): boolean => {
	if (!user || !user.role) return false;
	if (user?.role === "admin") return true;
	if (user?.role === "editor") return true;
	if (user?.role === "author") return true;

	return false;
};

export const anyone = () => true;

/**
 *
 * Just be logged in
 * @returns {boolean} for use in both {@link Field} and collections
 *

 */
export const authenticated = ({
	req: {user},
}:
	| AccessArgs<AuthorCollections>
	| FieldAccessArgs<AuthorCollections>): boolean => {
	return Boolean(user);
};
/**
 *  Accessor for personally sensitive data- {@link User} and {@link Admin}
 *
 *  Only allow admins and the user themselves
 *
 *  Note that editors are not allowed!
 *
 * @returns {Access} for use in {@link User} and {@link Admin} only!
 */
export const onlySelfOrAdmin: Access<User | Admin> = ({
	req: {user},
}: AccessArgs<User | Admin>) => {
	if (!user) return false;
	if (user?.role === "admin") return true;
	return {
		id: {
			equals: user?.id,
		},
	};
};
