"use client";

export function FieldClient<T extends FieldTypes>(
	type: T,
	props: AccessControlledFieldProps<T>
) {
	switch (type) {
		case "array":
			return ArrayField;
		case "blocks":
			return BlocksField;
		case "checkbox":
			return CheckboxField;
		case "code":
			return CodeField;
		case "collapsible":
			return CollapsibleField;
		case "date":
			return DateTimeField;
		case "email":
			return EmailField;
		case "group":
			return GroupField;
		case "join":
			return JoinField;
		case "json":
			return JSONField;
		case "number":
			return NumberField;
		case "point":
			return PointField;
		case "radio":
			return RadioGroupField;
		case "relationship":
			return RelationshipField;
		case "richText":
			return RichTextField;
		case "row":
			return RowField;
		case "select":
			return SelectField;
		case "tabs":
			return TabsField;
		case "text":
			return TextField;
		case "textarea":
			return TextareaField;
		case "ui":
			return UIField;
		case "upload":
			return UploadField;
		default:
			return null;
	}
}
