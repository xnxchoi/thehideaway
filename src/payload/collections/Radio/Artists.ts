import {ACField} from "@/AccessControlled/plugin";
import {CollectionConfig} from "payload";

export const Artists: CollectionConfig = {
	slug: "artists",
	fields: [{
		type: "text",
		name: "name",
		required: true,
		unique: true
	}, {
		type: "text",
		name: "slug",
		required: true,
		unique: true
	}, {
		type: "text",
		name: "description"
	}, {
		type: "group",
		name: "byArtist",
		label: "By this artist",
		fields: [{
			name: "tracks",
			type: "join",
			on: "artist",
			collection: "tracks",
			defaultLimit: 30,
		}, {
			name: "albums",
			type: "join",
			on: "artist",
			collection: "albums",
			defaultLimit: 30,
		}, {
			name: "playlists",
			type: "join",
			on: "artist",
			collection: "playlists",
			defaultLimit: 30,
		}
		]
	}, {
		type: "group",
		name: "meta",
		fields: [{
			name: "spotifyId",
			type: "text",
			unique: true,
			label: "Spotify ID",
			admin: {
				components: ACField("text", {
					allowAuthor: false,
					allowedRoles: ["admin"],
					overrides: {}
				})
			},
			hooks: {
				beforeChange: [({data, value, previousValue, operation, overrideAccess,}) => {
					if (operation === "create") {
						return value
					}
					if (operation === "update") {
						if (overrideAccess) return value;
						if (!previousValue) return value;
						return previousValue
					}
				}]
			}
		}
		]
	}
	]
}