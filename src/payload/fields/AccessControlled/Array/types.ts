import type {RP_Roles} from "@/stores/Notification/NotificationStore";
import {
	ArrayField,
	BlocksField,
	CheckboxField,
	CodeField,
	CollapsibleField,
	DateTimeField,
	EmailField,
	GroupField,
	JoinField,
	JSONField,
	NumberField,
	PointField,
	RadioGroupField,
	RelationshipField,
	RichTextField,
	RowField,
	SelectField,
	TabsField,
	TextareaField,
	TextField,
	UIField,
	UploadField
} from "@payloadcms/ui";
import type {
	ArrayFieldServerProps,
	BlocksFieldServerProps,
	CheckboxFieldServerProps,
	ClientUser,
	CodeFieldServerProps,
	CollapsibleFieldServerProps,
	CollectionSlug,
	DateFieldServerProps,
	EmailFieldServerProps,
	FieldTypes,
	GroupFieldServerProps,
	JoinFieldServerProps,
	JSONFieldServerProps,
	NumberFieldServerProps,
	PointFieldServerProps,
	RadioFieldServerProps,
	RelationshipFieldServerProps,
	RichTextFieldServerProps,
	RowFieldServerProps,
	SelectFieldServerProps,
	TabsFieldServerProps,
	TextareaFieldServerProps,
	TextFieldServerProps,
	UIFieldServerProps,
	UploadFieldServerProps
} from "payload";

export type FieldServerPropsMap = {
	[x in FieldTypes]:
	x extends "array" ? ArrayFieldServerProps :
		x extends "checkbox" ? CheckboxFieldServerProps :
			x extends "tabs" ? TabsFieldServerProps :
				x extends "email" ? EmailFieldServerProps :
					x extends "json" ? JSONFieldServerProps :
						x extends "richText" ? RichTextFieldServerProps :
							x extends "join" ? JoinFieldServerProps :
								x extends "date" ? DateFieldServerProps :
									x extends "group" ? GroupFieldServerProps :
										x extends "number" ? NumberFieldServerProps :
											x extends "radio" ? RadioFieldServerProps :
												x extends "select" ? SelectFieldServerProps :
													x extends "text" ? TextFieldServerProps :
														x extends "textarea" ? TextareaFieldServerProps :
															x extends "upload" ? UploadFieldServerProps :
																x extends "relationship" ? RelationshipFieldServerProps :
																	x extends "point" ? PointFieldServerProps :
																		x extends "ui" ? UIFieldServerProps :
																			x extends "code" ? CodeFieldServerProps :
																				x extends "blocks" ? BlocksFieldServerProps :
																					x extends "row" ? RowFieldServerProps :
																						x extends "collapsible" ? CollapsibleFieldServerProps :
																							never;
}
export type FieldFieldMap = {
	array: typeof ArrayField;
	checkbox: typeof CheckboxField;
	tabs: typeof TabsField;
	email: typeof EmailField;
	json: typeof JSONField;
	richText: typeof RichTextField;
	join: typeof JoinField;
	date: typeof DateTimeField;
	group: typeof GroupField;
	number: typeof NumberField;
	radio: typeof RadioGroupField;
	select: typeof SelectField;
	text: typeof TextField;
	textarea: typeof TextareaField;
	upload: typeof UploadField;
	relationship: typeof RelationshipField;
	point: typeof PointField;
	ui: typeof UIField;
	code: typeof CodeField;
	blocks: typeof BlocksField;
	row: typeof RowField;
	collapsible: typeof CollapsibleField;
};
export type AccessControlledFieldProps<T extends FieldTypes> =
	FieldServerPropsMap[T] & {
	allowedRoles?: RP_Roles[];
	allowAuthor?: boolean | undefined;
	conditionTester?: (props: {
		user?:
			| (ClientUser & {
			collection: "users" | "admins";
			role: RP_Roles | string;
		})
			| null;
		field?: FieldFieldMap[T];
		collection?: CollectionSlug;
	}) => boolean;
};
