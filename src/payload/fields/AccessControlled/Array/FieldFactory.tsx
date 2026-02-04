import type {
	ArrayFieldClient,
	ArrayFieldServerProps,
	BlocksFieldClient,
	BlocksFieldServerProps,
	CheckboxFieldClient,
	CheckboxFieldServerProps,
	ClientUser,
	CodeFieldClient,
	CodeFieldServerProps,
	CollapsibleFieldClient,
	CollapsibleFieldServerProps,
	CollectionSlug,
	DateFieldServerProps,
	EmailFieldClient,
	EmailFieldServerProps,
	Field,
	FieldTypes,
	GroupFieldClient,
	GroupFieldServerProps,
	JoinFieldClient,
	JoinFieldServerProps,
	JSONFieldClient,
	JSONFieldServerProps,
	NumberFieldClient,
	NumberFieldServerProps,
	PointFieldClient,
	PointFieldServerProps,
	RadioFieldClient,
	RadioFieldServerProps,
	RelationshipFieldClient,
	RelationshipFieldServerProps,
	RichTextFieldClient,
	RichTextFieldServerProps,
	RowFieldClient,
	RowFieldServerProps,
	SelectFieldClient,
	SelectFieldServerProps,
	TabsFieldClient,
	TabsFieldServerProps,
	TextareaFieldClient,
	TextareaFieldServerProps,
	TextFieldClient,
	TextFieldServerProps,
	UIFieldServerProps,
	UploadFieldClient,
	UploadFieldServerProps
} from "payload";
import type {AccessControlledFieldProps, FieldFieldMap} from "./types";
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
import {useMemo} from "react";

export function FieldFactory<
	T extends Exclude<FieldTypes, "tabs" | "collapsible">
>({props, type}: { props: AccessControlledFieldProps<T>; type: T }) {
	const {
		user,
		payload,
		id,
		schemaPath,
		permissions,
		clientField,
		collectionSlug,
		data,
		field,
		allowedRoles = ["admin"],
		allowAuthor = false,
		conditionTester: cT
	} = props;
	const conditionTester = cT
		? cT
		: ({
			   user
		   }: {
			user: ClientUser | null;
			field?: FieldFieldMap[T];
			collection?: CollectionSlug;
		}) => {
			if (!user) return false;
			const isAdmin = allowedRoles.some((r) => user.role === (r as string));
			if (isAdmin) return true;
			let isCl = false;
			if (allowAuthor) {
				if ("author" in data) {
					if (Array.isArray(data.author)) {
						const auth = data.author as (
							| string
							| { relationTo: "admins" | "users"; value: string }
							)[];
						if (
							auth.some((u) => {
								return (typeof u === "string" ? u : u.value) === user.id;
							})
						) {
							isCl = true;
						}
					} else {
						isCl = isCl || data.author === user.id;
					}
				}
			}
			return isCl;
		};
	const clear = conditionTester({
		user,
		field,
		collection: collectionSlug as CollectionSlug
	});

	if (!clear) {
		return null;
	}

	switch (type) {
		case "array":
			return (
				<ArrayField
					field={clientField as ArrayFieldClient}
					path={(props as ArrayFieldServerProps).path}
				/>
			);
		case "blocks":
			return (
				<BlocksField
					field={clientField as BlocksFieldClient}
					path={(props as BlocksFieldServerProps).path}
				/>
			);
		case "checkbox":
			return (
				<CheckboxField
					field={clientField as CheckboxFieldClient}
					path={(props as CheckboxFieldServerProps).path}
					schemaPath={(props as CheckboxFieldServerProps).schemaPath}
				/>
			);
		case "code":
			return (
				<CodeField
					field={clientField as CodeFieldClient}
					path={(props as CodeFieldServerProps).path}
					permissions={(props as CodeFieldServerProps).permissions}
					schemaPath={(props as CodeFieldServerProps).schemaPath}
				/>
			);

		case "date":
			return (
				<DateTimeField
					field={clientField as any}
					path={(props as DateFieldServerProps).path}
					permissions={(props as DateFieldServerProps).permissions}
					schemaPath={(props as DateFieldServerProps).schemaPath}
				/>
			);
		case "email":
			return (
				<EmailField
					field={clientField as EmailFieldClient}
					path={(props as EmailFieldServerProps).path}
					permissions={(props as EmailFieldServerProps).permissions}
					schemaPath={(props as EmailFieldServerProps).schemaPath}
				/>
			);
		case "group":
			return (
				<GroupField
					field={clientField as GroupFieldClient}
					forceRender={(props as GroupFieldServerProps).forceRender}
					path={(props as GroupFieldServerProps).path}
					permissions={(props as GroupFieldServerProps).permissions}
					schemaPath={(props as GroupFieldServerProps).schemaPath}
				/>
			);
		case "join":
			return (
				<JoinField
					field={clientField as JoinFieldClient}
					path={(props as JoinFieldServerProps).path}
					permissions={(props as JoinFieldServerProps).permissions}
					schemaPath={(props as JoinFieldServerProps).schemaPath}
				/>
			);
		case "json":
			return (
				<JSONField
					field={clientField as JSONFieldClient}
					path={(props as JSONFieldServerProps).path}
					permissions={(props as JSONFieldServerProps).permissions}
					schemaPath={(props as JSONFieldServerProps).schemaPath}
				/>
			);
		case "number":
			return (
				<NumberField
					field={clientField as NumberFieldClient}
					path={(props as NumberFieldServerProps).path}
					permissions={(props as NumberFieldServerProps).permissions}
					schemaPath={(props as NumberFieldServerProps).schemaPath}
				/>
			);
		case "point":
			return (
				<PointField
					field={clientField as PointFieldClient}
					path={(props as PointFieldServerProps).path}
					permissions={(props as PointFieldServerProps).permissions}
					schemaPath={(props as PointFieldServerProps).schemaPath}
				/>
			);
		case "radio":
			return (
				<RadioGroupField
					field={clientField as RadioFieldClient}
					path={(props as RadioFieldServerProps).path}
					permissions={(props as RadioFieldServerProps).permissions}
					schemaPath={(props as RadioFieldServerProps).schemaPath}
				/>
			);
		case "relationship":
			return (
				<RelationshipField
					field={clientField as RelationshipFieldClient}
					path={(props as RelationshipFieldServerProps).path}
					permissions={(props as RelationshipFieldServerProps).permissions}
					schemaPath={(props as RelationshipFieldServerProps).schemaPath}
				/>
			);
		case "richText":
			return (
				<RichTextField
					field={clientField as RichTextFieldClient}
					path={(props as RichTextFieldServerProps).path}
					permissions={(props as RichTextFieldServerProps).permissions}
					schemaPath={(props as RichTextFieldServerProps).schemaPath}
				/>
			);
		case "row":
			return <RowField field={clientField as RowFieldClient}/>;
		case "select":
			return (
				<SelectField
					field={clientField as SelectFieldClient}
					path={(props as SelectFieldServerProps).path}
					permissions={(props as SelectFieldServerProps).permissions}
					schemaPath={(props as SelectFieldServerProps).schemaPath}
				/>
			);

		case "text":
			return (
				<TextField
					field={clientField as TextFieldClient}
					path={(props as TextFieldServerProps).path}
					permissions={(props as TextFieldServerProps).permissions}
					schemaPath={(props as TextFieldServerProps).schemaPath}
				/>
			);
		case "textarea":
			return (
				<TextareaField
					field={clientField as TextareaFieldClient}
					path={(props as TextareaFieldServerProps).path}
					permissions={(props as TextareaFieldServerProps).permissions}
					schemaPath={(props as TextFieldServerProps).schemaPath}
				/>
			);
		case "ui":
			return <UIField/>;
		case "upload":
			return (
				<UploadField
					field={clientField as UploadFieldClient}
					path={(props as UploadFieldServerProps).path}
					permissions={(props as UploadFieldServerProps).permissions}
					schemaPath={(props as UploadFieldServerProps).schemaPath}
				/>
			);
		default:
			return null;
	}
}
