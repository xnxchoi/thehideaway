import type { Field } from "payload";

const getFieldName = (field: Field) => ("name" in field ? field.name : null);

export function mergeCollectionFields(
  existingFields: Field[],
  generatedFields: Field[]
): Field[] {
  const generatedByName = new Map(
    generatedFields
      .map((field) => [getFieldName(field), field] as const)
      .filter((entry): entry is readonly [string, Field] => entry[0] !== null)
  );
  const mergedNames = new Set<string>();

  const mergedExisting = existingFields.map((existingField) => {
    const name = getFieldName(existingField);
    if (!name) return existingField;
    const generatedField = generatedByName.get(name);
    if (!generatedField) return existingField;
    mergedNames.add(name);

    return {
      ...generatedField,
      ...existingField,
      custom: {
        ...generatedField.custom,
        ...existingField.custom
      }
    } as Field;
  });

  return [
    ...mergedExisting,
    ...generatedFields.filter((field) => {
      const name = getFieldName(field);
      return !name || !mergedNames.has(name);
    })
  ];
}
