import {
	accessControl,
	AccessOperations,
	AuthCollections,
	authCollections,
	BackendCollection,
	backendCollections,
	LockedContentOperations,
	ProvidedContent,
	providedContentCollections,
	UploadCollection,
	uploadsCollections,
	UserContentCollection,
	userContentCollections,
	UserType,
	userTypesCollections,
} from "@/lib/auth/permissions";
import {adminAc} from "better-auth/plugins/admin/access";

type OneOf<
	T extends | UserContentCollection
		| ProvidedContent
		| UploadCollection
		| BackendCollection
		| AuthCollections
		| UserType,
> = T extends UserContentCollection
	? UserContentCollection
	: T extends ProvidedContent
		? ProvidedContent
		: T extends BackendCollection
			? BackendCollection
			: T extends UserType
				? UserType
				: T extends AuthCollections
					? AuthCollections
					: T extends UploadCollection
						? UploadCollection
						: never;

type OperationsFor<T> = T extends
	| UserContentCollection
	| ProvidedContent
	| UploadCollection
	? AccessOperations | LockedContentOperations
	: AccessOperations;

export function accessToObject<
	T extends | UserContentCollection
		| ProvidedContent
		| BackendCollection
		| UserType
		| AuthCollections
		| UploadCollection,
	U extends
		| OperationsFor<T>
		| OperationsFor<T>[]
		| ((arg: T) => OperationsFor<T>[]),
>(
	obj: Array<T>,
	access: U,
): {
	[K in OneOf<T>]: OperationsFor<T>[];
} {
	return obj.reduce(
		(previousValue, cur) => {
			return {
				...previousValue,
				...{
					[cur]:
						typeof access === "function"
							? access(cur)
							: Array.isArray(access)
								? access
								: [access],
				},
			};
		},
		{} as { [props in OneOf<T>]: OperationsFor<T>[] },
	);
}

const memberContent = accessToObject(userContentCollections, ["read"]);
const backend = accessToObject(backendCollections, []);
const auth = accessToObject(authCollections, []);
const uploads = accessToObject(uploadsCollections, (collection) =>
	collection === "userMedia"
		? ["read", "create", "delete", "update"]
		: ["read", "create", "update"],
);
const users = accessToObject(userTypesCollections, (collection) =>
	collection === "users" ? ["read"] : [],
);
const providedContent = accessToObject(providedContentCollections, ["read"]);
const user = accessControl.newRole({
	...memberContent,
	...uploads,
	...backend,
	...users,
	...providedContent,
	self: ["read", "update", "delete"],
	// series: ["read"],
	bookmarks: ["read"],
	follows: ["read"],
	tags: ["read"],
	compilations: ["read", "create", "update", "delete"],
});

function accessCreator(props: {
	[x in "userContent" | "providedContent" | "uploads" | "backend" | "auth"]: {
		[y in AccessOperations | LockedContentOperations]?: boolean;
	};
}) {
	const {userContent, providedContent, uploads, backend} = props;
	const userC = accessToObject(userContentCollections, [
		...(Object.keys(userContent) as (
			| AccessOperations
			| LockedContentOperations
			)[]),
	]);
	const providedC = accessToObject(providedContentCollections, [
		...(Object.keys(providedContent) as (
			| AccessOperations
			| LockedContentOperations
			)[]),
	]);
	const uploadsC = accessToObject(uploadsCollections, [
		...(Object.keys(uploads) as (AccessOperations | LockedContentOperations)[]),
	]);
	const backendC = accessToObject(backendCollections, [
		...(Object.keys(backend) as AccessOperations[]),
	]);
	const authC = accessToObject(authCollections, [
		...(Object.keys(auth) as AccessOperations[]),
	]);
	return {
		...userC,
		...providedC,
		...uploadsC,
		...backendC,
		...authC,
		self: ["read", "update", "delete"],
	};
}

const admin = accessControl.newRole({
	...accessToObject(userContentCollections, [
		"read",
		"update",
		"delete",
		"create",
		"lock",
		"readLocked",
	]),
	...accessToObject(providedContentCollections, [
		"update",
		"delete",
		"read",
		"create",
		"lock",
		"readLocked",
	]),
	...accessToObject(uploadsCollections, [
		"update",
		"delete",
		"read",
		"create",
		"lock",
		"readLocked",
	]),
	...accessToObject(backendCollections, ["update", "delete", "read", "create"]),
	...accessToObject(userTypesCollections, [
		"update",
		"delete",
		"read",
		"create",
	]),
	...accessToObject(authCollections, ["read", "update", "delete", "create"]),
	self: ["read", "update", "delete"],
	profile: ["read", "update", "delete", "create", "readLocked", "lock"],
	// series: ["read", "update", "delete", "create"],
	bookmarks: ["read", "update", "delete", "create"],
	tags: ["read", "update", "delete", "create"],
	follows: ["read", "update", "delete", "create"],
	userViews: ["read", "update", "delete", "create"],
	citations: ["read", "update", "delete", "create"],
	compilations: ["read", "update", "delete", "create"],
	"payload-kv": ["read", "update", "delete", "create"],
	...adminAc.statements,
});
const create = true,
	update = true,
	del = true,
	read = true,
	lock = true,
	readLocked = true;
const member = accessControl.newRole({});
const editor = accessControl.newRole({
	...accessCreator({
		uploads: {
			create,
			update,
			delete: del,
			readLocked,
			lock,
			read,
		},
		userContent: {
			create,
			update,
			delete: del,
			readLocked,
			lock,
			read,
		},
		backend: {
			read,
		},
		providedContent: {
			create,
			update,
			readLocked,
			lock,
			read,
		},
		auth: {read},
	}),
	admins: ["read"],
	users: ["read", "update"],
	self: ["read", "update", "delete"],
	// series: ["read", "update", "create"],
	tags: ["read", "update", "create"],
	bookmarks: ["read"],
	follows: ["read"],
});
const author = accessControl.newRole({
	...accessCreator({
		backend: {},
		providedContent: {
			read,
		},
		uploads: {
			read,
			create,
			delete: del,
			update,
			lock,
			readLocked,
		},
		userContent: {
			read,
			create,
			update,
			delete: del,
			lock,
			readLocked,
		},
		auth: {
			read,
		},
	}),
	users: ["read"],
	admins: ["read"],
	profile: ["read", "update", "lock", "readLocked"],
	self: ["read", "update", "delete"],
	// series: ["read", "update", "create"],
	bookmarks: ["read"],
	tags: ["read", "update", "create"],
	follows: ["read"],
});
const patron = accessControl.newRole({
	...accessCreator({
		auth: {
			read,
		},
		userContent: {
			read,
			readLocked,
		},
		providedContent: {
			read,
			readLocked,
		},
		uploads: {
			read,
			readLocked,
			create,
			delete: del,
			update,
		},
		backend: {},
	}),
	admins: [],
	users: ["read"],
	self: ["read", "update", "delete"],
	// series: ["read"],
	bookmarks: ["read"],
	follows: ["read"],
	compilations: ["read", "create", "update", "delete"],
});
const cofounder = editor;
const resident = user;

export { author, admin, user, editor, patron, cofounder, resident };
