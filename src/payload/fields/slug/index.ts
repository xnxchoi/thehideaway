import type { CheckboxField, TextField } from "payload";
import { formatSlugHook } from "./formatSlug";
import { nanoid } from "nanoid";

type Overrides = {
  slugOverrides?: Partial<TextField>;
  checkboxOverrides?: Partial<CheckboxField>;
};

type Slug = (
  fieldToUse?: string,
  overrides?: Overrides
) => [TextField, TextField, CheckboxField, TextField];

export const slugField: Slug = (fieldToUse = "title", overrides = {}) => {
  const { slugOverrides, checkboxOverrides } = overrides;

  const checkBoxField: CheckboxField = {
    name: "slugLock",
    type: "checkbox",
    required: true,
    defaultValue: () => true,
    admin: {
      hidden: true,
      position: "sidebar"
    },
    ...checkboxOverrides
  };
  const hashKeyField: TextField = {
    name: "hashId",
    type: "text",
    index: true,
    admin: {
      hidden: true
    },
    required: true,
    access: {
      read: () => true,
      update: () => false
    },
    defaultValue: () => nanoid(11),
    hooks: {
      // beforeValidate: [
      // 	async ({
      // 		siblingData,
      // 		operation,
      // 		value,
      // 		originalDoc,
      // 		previousValue,
      // 		collection,
      // 		data,
      // 		context
      // 	}) => {
      // 		const fallback = operation === 'create' ? value : previousValue;
      // 		if (operation === 'update' || operation === 'create') {
      // 			if (typeof siblingData !== 'object' || !siblingData||!data) {
      // 				return fallback
      // 			}
      // 			const keys:string[] = [];
      // 			if (operation === 'create') {
      // 				if ('author' in data) {
      // 					let authorId: (string | string[]) | undefined = data.author as (string | string[]);
      // 					authorId = Array.isArray(authorId) ? authorId[0] : authorId;
      // 					authorId&&keys.push(authorId);
      // 				}
      // 				keys.push(siblingData.slugKey as string);
      // 				return await createHashId(keys.join(''));
      // 			}
      // 		}
      // 		context.rehashRequired = false;
      // 		return fallback
      // 	}
      // ],
      // beforeChange: [
      // 	async ({
      // 		req,
      // 		context,
      // 		value,
      // 		originalDoc,
      // 		collection,
      // 		siblingData,
      // 		previousValue,
      // 		operation
      // 	}) => {
      // 		const fallback = operation === 'create' ? value : previousValue;
      // 		if (!collection) return fallback;
      // 		let meaningfulChange = false;
      // 		if (operation === 'create') {
      // 			context.rehashRequired = false;
      // 			return fallback;
      // 		}
      // 		if (operation === 'update') {
      // 			if ('author' in originalDoc) {
      // 				const collectionHasAuthorMany = (collection.fields.findIndex(
      // 					r => 'name' in r && r.name === 'author' && r.type === 'relationship' && r.hasMany === true) > -1) || false;
      // 				if (collectionHasAuthorMany) {
      // 					const ogAuthor = (originalDoc?.author || []) as string[];
      // 					const nuAuthor = siblingData?.author || ogAuthor;
      // 					meaningfulChange = !(arraysEqualContents(
      // 						ogAuthor, nuAuthor));
      // 				} else {
      // 					const ogAuthor = (originalDoc?.author) as string[] | undefined;
      //
      // 					const nuAuthor = siblingData?.author || ogAuthor;
      //
      // 					meaningfulChange = ogAuthor && (ogAuthor !== nuAuthor) || false;
      // 				}
      // 			}
      // 			if ('slugKey' in originalDoc) {
      // 				const ogSlugKey = originalDoc?.slugKey as (string | undefined);
      // 				meaningfulChange = meaningfulChange || ((ogSlugKey && siblingData?.slugKey && (typeof siblingData.slugKey === 'string') && (ogSlugKey !== siblingData.slugKey)) || false);
      // 			}
      // 			context.rehashRequired = meaningfulChange;
      // 			if (meaningfulChange) context.overrideAccess = true;
      // 		}
      // 		return fallback;
      // 	}
      // ],
      // afterChange: [
      // 	async ({req, context, originalDoc, previousDoc, collection, operation}) => {
      // 		if (!collection || !(context.rehashRequired)) return originalDoc;
      // 		const newHashTarget: string[] = [];
      // 		if ('author' in originalDoc) {
      // 			if (!originalDoc.author) {
      // 				req.payload.logger.error(
      // 					'Error while updating doc in ' + collection.slug + ' with id ' + originalDoc.id + '; Author field is undefined. This should never happen, since the author field is required regardless of the collection type. Right..?');
      // 			}
      // 			const collectionHasAuthorMany = (collection.fields.findIndex(
      // 				r => 'name' in r && r.name === 'author' && r.type === 'relationship' && r.hasMany === true) > -1) || false;
      // 			if (collectionHasAuthorMany) {
      // 				newHashTarget.push((originalDoc.author as string[]).join('|'));
      // 			} else {
      // 				newHashTarget.push(originalDoc.author as string);
      // 			}
      // 		} else if (collection.slug === 'users') {
      //
      // 		}
      //
      // 		newHashTarget.push(originalDoc.slugKey);
      // 		const newHashId = await createHashId(newHashTarget.join(''));
      // 		const {needed, updatedAt: _u, id: oID} = originalDoc;
      // 		const rr = await req.payload.update({
      // 			collection: collection.slug,
      // 			id: oID,
      // 			data: {
      // 				...needed,
      // 				hashId: newHashId
      // 			},
      // 			context: {
      // 				...req.context,
      // 				overrideAccess: true,
      // 			},
      // 			overrideAccess: true,
      // 			req,
      // 		}).then(r => r).then(
      // 			docs => docs || false).
      // 			catch(r => {
      // 				req.payload.logger.error(r);
      // 				return false;
      // 			});
      //
      // 		if (typeof rr === 'boolean') {
      // 			req.payload.logger.error(
      // 				`Error while updating doc in ${collection.slug} with id ${oID} with new hashId ${newHashId}`);
      // 			return originalDoc;
      // 		}
      //
      // 		context.rehashRequired = false;
      // 		return rr;
      // 	}
      // ]
    }
  };
  // Expect ts error here because of typescript mismatching Partial<TextField> with TextField
  // @ts-expect-error
  const slugField: TextField = {
    name: "slugKey",
    type: "text",
    index: true,
    label: "Slug",
    hooks: {
      // Kept this in for hook or API based updates
      beforeValidate: [formatSlugHook(fieldToUse)],
      beforeChange: [
        ({ value, siblingData }): string => {
          siblingData["slug"] = encodeURIComponent(
            value + "-" + siblingData.hashId
          );
          return value;
        }
      ],
      afterRead: [({ value }) => value]
    },
    admin: {
      position: "sidebar",
      ...(slugOverrides?.admin || {}),
      components: {
        Field: {
          path: "@/payload/fields/slug/SlugServerComponent.tsx",
          serverProps: {
            fieldToUse,
            checkboxFieldPath: checkBoxField.name
          }
        }
      }
    },
    ...(slugOverrides || {})
  };
  const realSlug: TextField = {
    type: "text",
    name: "slug",
    admin: {
      hidden: true
    },
    access: {
      read: () => true
    },
    required: true,
    defaultValue: () => nanoid(),
    hooks: {
      afterRead: [({ value }) => decodeURIComponent(value)]
    }
  };

  return [slugField, hashKeyField, checkBoxField, realSlug];
};
