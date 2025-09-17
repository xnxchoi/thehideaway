import { User } from "@/payload-types";
import type {
	CheckboxField,
	CollectionConfig,
	CollectionSlug,
	DateField,
	JoinField,
	Plugin,
	SelectField,
	TabsField,
	TextField,
} from "payload";

export type UserFieldOrganizerConfig = {
	enabled?: boolean;
	excludeCollections?: CollectionSlug[];
};
export const userFieldOrganizerPlugin =
	(pluginOptions: UserFieldOrganizerConfig): Plugin =>
		(incomingConfig) => {
			const config = { ...incomingConfig };
			config.collections = [...(config.collections || [])];
			if (pluginOptions.enabled === false) {
				return config;
			}
			const collections = [...config.collections].map((collection) => {
				const fields = [...(collection.fields || [])].map(f => {
					if (f.type === 'date') {
						return Object.entries(f).reduce((acc, [key, value]) => {
							if (typeof value === 'function' && (key.startsWith('on'))) return acc;
							return {
								...acc,
								[key]: value
							}
						}, {} as DateField)
					}
					return f
				});
				const r = {
					...collection,
					fields
				}
				return r;
			}) satisfies CollectionConfig[]
			const userCollection = collections.find((c) => c.slug === "users");
			if (userCollection) {
				const userFields = [...(userCollection.fields || [])];
				const fieldsToShow: ((keyof User) | 'foto' | 'dynamicLabel' | 'managePasskeys')[] = [
					"foto",
					"bio",
					"location",
					"link",
					"firstName",
					"lastName",
					"dynamicLabel",
					"slug",
					"profile",
					"email",
					"managePasskeys",
					"meta",
				];
				const fieldsToModify: ((keyof User) | 'foto' | 'dynamicLabel' | 'managePasskeys')[] = [
					"role",
					"banned",
					"username",
					"twoFactorEnabled",
					"emailVerified",
					"name",
					"onboarded",
				];
				userFields.forEach((field) => {
					if (
						("name" in field &&
							!(fieldsToShow as string[]).includes(field.name) &&
							!(fieldsToModify as string[]).includes(field.name) &&
							field.name !== "id") ||
						!("name" in field)
					) {
						let fieldAdmin = {
							...field.admin,
						};
						switch (field.type) {
							case "textarea":
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Textarea/index.tsx#AdminOnlyTextareaField",
									},
								}
								break;
							case 'text':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Text/index.tsx#AdminOnlyTextField",
									},
								}
								break;
							case 'select':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Select/index.tsx#AdminOnlySelectField",
									},
								}
								break;
							case 'checkbox':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "@/payload/fields/AdminOnly/Checkbox/index.tsx#AdminOnlyCheckboxField",
									},
								}
								break;
							case 'number':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Number/index.tsx#AdminOnlyNumberField",
									},
								}
								break;
							case 'array':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Array/index.tsx#AdminOnlyArrayField",
									},
								}
								break;
							case 'email':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Email/index.tsx#AdminOnlyEmailField",
									},
								}
								break;
							case 'json':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Json/index.tsx#AdminOnlyJSONField",
									},
								}
								break;

							case 'relationship':
								fieldAdmin = {
									...fieldAdmin,
									components: {
										Field: "src/payload/fields/AdminOnly/Relationship/index.tsx#AdminOnlyRelationshipField",
									},
								}
								break;
							default:
								fieldAdmin = {
									...fieldAdmin,
									readOnly: true,
								}

						}


						field.admin = fieldAdmin;
					}
					if ("name" in field && field.name === "email") {
						field.admin = {
							...field.admin,
							readOnly: true,
						};
					}
				});

				const namedFields = userFields.filter((f) => "name" in f);
				const slug = namedFields.find((f) => f.name === "slug")!;
				const foto = namedFields.find((f) => f.name === "foto")!;
				const firstName = namedFields.find((f) => f.name === "firstName")!;
				const lastName = namedFields.find((f) => f.name === "lastName")!;
				const bio = namedFields.find((f) => f.name === "bio")!;
				const location = namedFields.find((f) => f.name === "location")!;
				const link = namedFields.find((f) => f.name === "link")!;
				const dynamicLabel = namedFields.find((f) => f.name === "dynamicLabel")!;
				const managePasskeys = namedFields.find(
					(f) => f.name === "managePasskeys",
				)!;
				const email = namedFields.find((f) => f.name === "email")!;
				const meta = namedFields.find((f) => f.name === "meta")!;
				const profile = namedFields.find(
					(f) => f.name === "profile",
				) as JoinField;
				const role = userFields.find(
					(f) => "name" in f && f.name === "role",
				) as SelectField;

				const newRole = {
					...role,
					hasMany: false,
					required: true,
					defaultValue: "author",
					index: true,
					access: {
						...role.access,
						read: () => true,
						update: ({ req }) => {
							if (req.context.overrideAccess === true) return true;
							if (req.user?.role === "admin") return true;
							return false;
						},
					},
				} as SelectField;

				const onboarded = userFields.find(
					(f) => "name" in f && f.name === "onboarded",
				) as CheckboxField;

				const newOnboarded = {
					...onboarded,
					admin: {
						...onboarded.admin,
						components: {
							Field: "@/payload/fields/AdminOnly/Checkbox/index.tsx#AdminOnlyCheckboxField",
						},
					},
					required: true,
					defaultValue: false,
					access: {
						...onboarded.access,
						read: () => true,
						update: ({ req }) => {
							if (req.context.overrideAccess === true) return true;
							if (req.user?.role === "admin") return true;
							return false;
						},
					},
				};

				const banned = userFields.find(
					(f) => "name" in f && f.name === "banned",
				) as CheckboxField;
				const newBanned = {
					...banned,
					required: true,
					defaultValue: false,
					admin: {
						...banned.admin,
						components: {
							Field: 	"@/payload/fields/AdminOnly/Checkbox/index.tsx#AdminOnlyCheckboxField",
						},
					},
					access: {
						...banned.access,
						read: () => true,
						update: ({ req, id }) => {
							if (req.context.overrideAccess === true) return true;
							const user = req.user;
							if (user?.role === "admin") return true;
							if (user && user.id === id) return false;
							return false;
						},
					},
				};
				const username = userFields.find(
					(f) => "name" in f && f.name === "username",
				) as TextField;
				const newUsername: TextField = {
					...username,
					required: true,
					defaultValue: ({ req }) => {
						return "";
					},
					admin: {
						hidden: true,
					},
				};
				const twoFactorEnabled = userFields.find(
					(f) => "name" in f && f.name === "twoFactorEnabled",
				) as CheckboxField;
				const newTwoFactorEnabled = {
					...twoFactorEnabled,
					required: true,
					defaultValue: false,
				};
				const emailVerified = userFields.find(
					(f) => "name" in f && f.name === "emailVerified",
				) as CheckboxField;
				const newEmailVerified: CheckboxField = {
					...emailVerified,
					required: true,
					defaultValue: false,
					access: {
						update: ({ req }) => {
							if (req.context.overrideAccess === true) return true;
							if (req.user?.role === "admin") return true;
							return false;
						},
					},
					admin: {
						components: {
							Field: "@/payload/fields/AdminOnly/Checkbox/index.tsx#AdminOnlyCheckboxField",
						}
					}
				};
				const name = userFields.find(
					(f) => "name" in f && f.name === "name",
				) as TextField;
				const newName = {
					...name,
					required: true,
					defaultValue: "",
					index: true,
				};
				const restFields = userFields.filter(
					(f) =>
						!("name" in f) ||
						(!(fieldsToShow as string[]).includes(
							f.name) && !(fieldsToModify as string[]).includes(f.name)),
				);
				const firstTab: TabsField["tabs"][number] = {
					label: "Personal Information",
					fields: [
						foto,
						slug,
						{
							type: "row",
							fields: [{ ...firstName }, { ...lastName }],
						},
						{ ...newUsername },
						{ ...dynamicLabel },
						{ ...bio },
						{ ...location },
						{ ...link },
					],
				};
				const secondTab: TabsField["tabs"][number] = {
					label: "Profile",
					fields: [{ ...profile }],
				};
				const thirdTab: TabsField["tabs"][number] = {
					label: "Account & Security",
					fields: [
						{ ...email },
						{ ...managePasskeys },
						{ ...newRole },
						{ ...newOnboarded },
						{ ...newBanned },
						{ ...newTwoFactorEnabled },
						{ ...newEmailVerified },
						{ ...newName },
						...restFields,
					],
				};
				const fourthTab: TabsField["tabs"][number] = {
					label: "Socials",
					fields: [{ ...meta }],
				};
				const tabField: TabsField = {
					type: "tabs",
					tabs: [firstTab, secondTab, thirdTab, fourthTab],
					admin: {
						components: {
							Field: "@/payload/fields/Tabs/index.tsx",
						},
					},
				};
				userCollection.fields = [tabField];
			}
			config.collections = [...collections];
			return config;
		};
