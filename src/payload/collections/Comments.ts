import {
	Access,
	CollectionConfig,
	CollectionSlug,
	FieldAccess,
	Plugin,
	User,
} from "payload";
import {roleToAuthority} from "../plugins/locker/fields/authority/utils";
import {nanoid} from "nanoid";
import {processMentions} from "./Comments/hooks/processMentions";

// Types for our Comments Collection
export interface Comment {
	id: string;
	content: string;
	author: string | User;
	collection:
		| {
		relationTo: Extract<CollectionSlug, "posts" | "delta">;
		value: string; // The ID of the related document
	}
		| string; // Collection relationship
	createdAt: string;
	updatedAt: string;
	isEdited: boolean;
	isReply: boolean;
	parentComment?: string | Comment; // Reference to parent comment if this is a reply
	mentions: Array<string | User>; // Array of mentioned users
	isSticky: boolean;
	likes: Array<string | User>; // Array of users who liked the comment
}

// Access control functions
const isAdminOrAuthor: Access = ({req: {user}}) => {
	if (!user) return false;
	if (user?.role === "admin") return true;
	if (user?.role === "editor") return true;

	return {
		author: {
			equals: user.id,
		},
	};
};

// Check if comments are enabled for the referenced document
const areCommentsEnabled: Access = async ({req, data, id}) => {
	const {payload} = req;

	// For existing comments, get collection and documentId from saved data
	let collectionValue = null;
	let documentId = data?.documentId;

	// Extract collection information
	if (data?.collection) {
		if (
			typeof data.collection === "object" &&
			data.collection.relationTo &&
			data.collection.value
		) {
			// It's a relationship object
			collectionValue = data.collection.relationTo;
			// documentId is already set above
		} else {
			// It's a string (legacy format or just the collection name)
			collectionValue = data.collection;
		}
	}

	// If editing an existing comment and we don't have data yet, fetch it
	if ((!collectionValue || !documentId) && id) {
		try {
			const comment = await payload.findByID({
				collection: "comments",
				id,
			});

			if (
				typeof comment.collection === "object" &&
				comment.collection.relationTo
			) {
				collectionValue = comment.collection.relationTo;
			} else {
				collectionValue = comment.collection;
			}

			documentId = comment.documentId;
		} catch (error) {
			console.error(`Error fetching comment ${id}:`, error);
			return false;
		}
	}

	// If we have collection and documentId, check if comments are enabled
	if (collectionValue && documentId) {
		try {
			const document = await payload.findByID({
				collection: collectionValue as CollectionSlug,
				id: documentId,
			});

			// If commentsEnabled is explicitly false, block access
			if (document.commentsEnabled === false) {
				// Allow admins and editors to still see the comments even if disabled
				if (
					req.user &&
					req.user.role &&
					["editor", "admin"].includes(req.user.role)
				) {
					return true;
				}

				// Check if user is an author of the post
				if (req.user && document.author) {
					if (
						req.user.role &&
						roleToAuthority(req.user.role) >= roleToAuthority("author") &&
						document.author === req.user?.id
					) {
						return true;
					}
				}
				return false;
			}
			// Comments are enabled, grant access
			return true;
		} catch (error) {
			console.error(
				`Error checking commentsEnabled for ${collectionValue}/${documentId}:`,
				error,
			);
			// If we can't determine, default to allowing access
			return true;
		}
	}

	// If we can't determine, default to allowing access
	return true;
};

// Field-level access for sticky functionality
// Only allow collection admins or content author to make sticky
const canMakeSticky: FieldAccess = ({req: {user}, data}) => {
	if (!user) return false;
	if (user?.role === "admin") return true;
	if (user?.role === "editor") return true;
	if (Array.isArray(data?.author)) {
		return data?.author.length > 0 && data?.author.some((au) => au === user.id);
	} else if (data?.author === user.id) return true;
	// Check if the user is the author of the content being commented on
	// This requires additional logic in an actual hook
	return false;
};

interface CommentsPluginOptions {
	collections: CollectionSlug[];
	enabled?: boolean;
	commentsSlug?: string;
	overrides?: {
		[key: CollectionSlug]: {
			/**
			 * whether comments are deletable
			 * default true
			 */
			allowDelete?: boolean;
			/**
			 * Custom access control for comments
			 * default:
			 * read - anyone
			 * create - anyone logged in
			 * update - author of the comment / admin
			 * delete - author of the comment / admin
			 */
			access?: {
				read?: Access;
				create?: Access;
				update?: Access;
				delete?: Access;
			};
			maxDepth?: number;
			enableNotifications?: boolean;
			moderationRequired?: boolean;
		};
	};
}

const commentsSlug = "comments";
const enabledCollections: CollectionSlug[] = ["posts", "delta"];
const CommentsCollection: CollectionConfig = {
	slug: commentsSlug,
	admin: {
		useAsTitle: "content",
		defaultColumns: [
			"content",
			"author",
			"collection",
			"createdAt",
			"isSticky",
		],
	},
	access: {
		read: areCommentsEnabled,
		create: (args) => {
			const {
				req: {user},
			} = args;
			if (!user) return false;
			// Check if comments are enabled before allowing creation
			return areCommentsEnabled(args);
		},
		update: async (args) => {
			// Must be admin/author AND comments must be enabled
			const canEdit = isAdminOrAuthor(args);
			if (!canEdit) return false;

			return areCommentsEnabled(args);
		},
		delete: async (args) => {
			// Must be admin/author AND comments must be enabled
			const canDelete = isAdminOrAuthor(args);
			if (!canDelete) return false;

			return areCommentsEnabled(args);
		},
	},
	hooks: {
		beforeChange: [
			// Process mentions from content
			processMentions, // Set isEdited flag when content is updated after creation
			({data, originalDoc}) => {
				if (originalDoc && data.content !== originalDoc.content) {
					data.isEdited = true;
				}
				return data;
			},
		],
	},
	fields: [
		{
			name: "content",
			type: "richText",
			required: true,
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			hasMany: false,
			maxDepth: 0,
			required: true,
			index: true,
			access: {
				update: () => false,
			},
		},
		{
			name: "document",
			label: "Document",
			type: "relationship",
			relationTo: enabledCollections,
			required: true,
			index: true,
			admin: {
				description: "Which document this comment belongs to",
			},
			access: {
				update: ({req}) => {
					if (req.context.overrideAccess) {
						return true;
					}
					if (!req.user) return false;
					return req.user.role === "admin";
				},
			},
			hasMany: false,
			maxDepth: 0,
		},

		{
			name: "status",
			type: "select",
			defaultValue: "published",
			options: [
				{label: "Published", value: "published"},
				{label: "Deleted", value: "deleted"},
				{label: "Hidden", value: "hidden"},
			],
			admin: {
				description: "Comment status",
			},
		},
		{
			name: "isEdited",
			label: "Edited",
			type: "checkbox",
			admin: {
				readOnly: true,
			},
			required: true,
			defaultValue: false,
			access: {
				read: () => true,
				create: () => false,
				update: ({doc, data, req}) => {
					if (req.user && req.user.role === "admin") return true;
					if (req.context.overrideAccess) return true;
					if (!doc) return false;
					return "isEdited" in doc && doc.isEdited !== true;
				},
			},
		},
		{
			name: "depth",
			type: "number",
			admin: {
				hidden: true,
			},
			required: true,
			defaultValue: 0,
			hooks: {
				beforeChange: [],
			},
		},
		{
			name: "hash",
			type: "text",
			index: true,
			defaultValue: () => nanoid(5),
			hooks: {
				beforeChange: [
					({operation, siblingData, data, value, req, previousValue}) => {
						if (operation === "create") {
							if (value && value.length === 5) {
								const authorId = siblingData?.author || data?.author;
								if (typeof authorId === "string") {
									return value + authorId;
								}
							}
						}
						return previousValue;
					},
				],
			},
			access: {
				update: () => false,
			},
			required: true,
		},
		// {
		//   name: "parent",
		//   label: "Parent Comment",
		//   type: "relationship",
		//   relationTo: "comments",
		//   hasMany: false,
		//   maxDepth: 0,
		//   admin: {
		//     description: "Select which comment this is a reply to",
		//   },
		// },

		{
			name: "mentions",
			label: "Mentions",
			type: "relationship",
			relationTo: "users",
			maxDepth: 0,
			hasMany: true,
			hooks: {
				afterChange: [],
			},
		},
		{
			name: "isSticky",
			label: "Sticky Comment",
			type: "checkbox",
			defaultValue: false,
			access: {
				update: canMakeSticky,
			},
			admin: {
				description: "Pin this comment to the top",
			},
		},
	],
	timestamps: true,
};
// Comments Collection Config
const commentsPlugin =
	(options): Plugin =>
		(incomingConfig) => {
		};
