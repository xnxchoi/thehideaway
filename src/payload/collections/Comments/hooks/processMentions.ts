import {CollectionBeforeChangeHook} from "payload";
import {SerializedEditorState} from "@payloadcms/richtext-lexical/lexical";
import {convertLexicalToPlaintext} from "@payloadcms/richtext-lexical/plaintext";

// Regex to find mentions in the format @username
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export const processMentions: CollectionBeforeChangeHook = async ({
	req,
	data,
	operation,
	originalDoc,
}) => {
	const {payload} = req;

	// Only process if we have content
	if (!data.content) return data;
	const ccontent = data.content as SerializedEditorState;
	// Extract mentions from content
	const stringContent = convertLexicalToPlaintext({data: ccontent});
	const mentionMatches = [...stringContent.matchAll(MENTION_REGEX)];
	const mentionUsernames = mentionMatches.map((match) => match[1]);

	if (mentionUsernames.length === 0) {
		// No mentions found
		data.mentions = [];
		return data;
	}

	// Find users by username
	const mentionedUsers: string[] = [];

	for (const username of mentionUsernames) {
		try {
			const user = await payload.find({
				collection: "users",
				where: {
					name: {
						equals: username,
					},
				},
				limit: 1,
			});

			if (user.docs.length > 0) {
				mentionedUsers.push(user.docs[0].id);
			}
		} catch (error) {
			console.error(`Error finding user ${username}:`, error);
		}
	}

	// Set the mentions array
	data.mentions = mentionedUsers;

	// Optionally, create notifications for mentioned users here

	return data;
};
