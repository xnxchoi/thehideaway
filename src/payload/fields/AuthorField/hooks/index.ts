import type { CollectionBeforeChangeHook } from "payload";
import { AuthorCollections, AuthorCollectionsSlug } from "@/payload/collections/Compilations/actions";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { Admin, User } from "@payload-types";
import { arraysEqualContents } from "@/utilities/compareArrays";

type HasManyAuthorCond<T extends boolean = false> = T extends true ? Extract<AuthorCollections, {
  author: (string | User)[]
}> : T extends false ? Extract<AuthorCollections, {
  author: (string | User);
}> : never;
type BECH<T extends boolean> = Parameters<CollectionBeforeChangeHook<HasManyAuthorCond<T>>>[0]
/**
 *
 *  Intended for collections with single-author field
 *  Checks whether the current request is valid to make edits to a collection document based on the request object value, operation, data and (if any) the pre-change document values
 *  Returns answer to "is the request valid for modifying the doc in any way?"
 *  Is deny-by-default, only clearly valid requests will return true
 */
const checkAuthor = <TCollection extends HasManyAuthorCond<false>>({
  userData, operation, originalDoc, req
}: Parameters<CollectionBeforeChangeHook<TCollection>>[0] & {
  userData: User | Admin
}): boolean => {
  switch (operation) {
    case "update": {
      const ogA = originalDoc?.author;
      return !!ogA && ((typeof ogA === "string" ? ogA : ogA.id) === userData.id);
      // let authorRole: User["role"] = "user";
      // if (typeof ogA !== "string") {
      //   authorRole = ogA.role;
      // } else {
      //   const que = await payload.findByID({
      //     collection: "users", id: ogA, select: {
      //       role: true
      //     }
      //   }).then((user) => user.role).catch((err) => {
      //     payload.logger.error(`Error while checking author role via querying author by ID : ${ogA}`);
      //     return null
      //   });
      //   que && (authorRole = que);
      // }
      // const editorLvl= roleToAuthority("editor");
      // const userLvl = roleToAuthority(userData.role);
      // const authorizedLv=roleToAuthority(authorRole);
      // const authorsLvl=roleToAuthority('author');
      // if(userLvl>=editorLvl){
      //
      // }
    }
    case "create":
      return true;

  }
};
/**
 * Intended for collections with many-authors field
 *  Checks whether the current request is valid to make edits to a collection document based on the request object value, operation, data and (if any) the pre-change document values
 *  Returns answer to "is the request valid for modifying the doc in any way?"
 *
 */
const checkAuthors = <TCollection extends HasManyAuthorCond<true>>({
  userData, operation, originalDoc, req
}: Parameters<CollectionBeforeChangeHook<TCollection>>[0] & {
  userData: User | Admin
}): boolean => {
  switch (operation) {
    case "update": {
      const authors = (originalDoc?.author ?? []).map(r => typeof r === "string" ? r : r.id);
      return authors.some(s => s === userData.id);
    }
    case "create":
      return true;
  }
};

const checkAuthorable = (hasMany: boolean, args: BECH<typeof hasMany>): boolean => {
  const { data, operation, originalDoc, req, collection, context } = args;
  //First, check req for user data
  // Modified data should exist; it can't be null altogether
  const payload = req.payload;
  if (!data) {
    payload.logger.info(`Author check error in ${collection.slug} doc ${operation}:\tData missing`);
    return false;
  }
  if (context.overrideAccess === true) return true;
  const userData = req.user;
  //Request user property should exist
  if (!userData) {
    payload.logger.info(
      `Author check error in ${collection.slug} doc ${operation}${(operation === "update" ? ", id: " + data.id : "")}:\tUser data missing`);
    return false;
  }
  if (userData.role === "admin") {
    return true;
  }
  if (userData.banned) return false;
  return hasMany ? checkAuthors({
    ...(args as Parameters<CollectionBeforeChangeHook>[0]), userData
  }) : checkAuthor({
    ...(args as Parameters<CollectionBeforeChangeHook>[0]), userData
  });
};
export const sanitizeAuthorData = <TCollection extends AuthorCollectionsSlug>(t: undefined | {
  hasMany?: boolean; collection: TCollection;
}) => {
  const hasMany = t?.hasMany ?? false;
  const hook: CollectionBeforeChangeHook<CollectionMap[TCollection]> = ({
    data, operation, originalDoc, req: { user }
  }) => {

  };
  // switch (operation) {
  //   case 'update':
  //     if(data._status===(originalDoc as Post)._status) {
  //     }
  // }
  // if (operation === "create" || operation === "update") {
  //   if (data._status === "published") {
  //     const author = data.author as string | undefined;
  //     if (!context.overrideAccess && req.user?.role !== "admin") {
  //       if (!author) {
  //         if (roleToAuthority(req.user?.role || "guest") < 2) {
  //           data._status = "draft";
  //         }
  //       } else {
  //         if (author === req.user?.id) {
  //           roleToAuthority(req.user?.role || "guest") < 2&&
  //           (data._status = "draft");
  //
  //         } else {
  //           const role = await req.payload
  //             .findByID({
  //               collection: "users",
  //               id: author,
  //               select: { role: true }
  //             })
  //             .then((r) => r.role)
  //             .catch((e) => {
  //               req.payload.logger.error(e);
  //               return "user" as RP_Roles;
  //             });
  //           if (roleToAuthority(role) < 2) {
  //             data._status = "draft";
  //           }
  //         }
  //       }
  //     }
  //   }

};


export const sanitizeAuthor = <T extends boolean>(hasMany: T): CollectionBeforeChangeHook<HasManyAuthorCond<T>> => {
  return hasMany ? ((async (args: BECH<true>) => {
    const canAuthor = checkAuthorable(hasMany, args);
    const { data, req, operation, originalDoc, collection: { slug: col } } = args;
    const payload = req.payload;
    if (!canAuthor) {
      throw new Error(`Error in ${col} ${operation}:\tInvalid permissions`);
    }
    const user = req.user!;
    if (operation === "create") {
      data.author = [...new Set([...(data?.author || []).map(r => typeof r === "string" ? r : r.id), user.id])];
    } else {
      if (data.author) {
        const ogA = (originalDoc?.author || []).map(r => typeof r === "string" ? r : r.id);
        const newA = data.author.map(r => typeof r === "string" ? r : r.id);
        if (!arraysEqualContents(ogA, newA)) {
          //This is to ensure we don't unintentinally add admins and editors - user is only added if present in the original author list
          if (ogA.some(r => r === user.id)) {
            data.author = [...new Set([...newA, user.id])];
          }
        }
      }
    }
    let authorData: string[] = (data.author || []).filter(r => typeof r === "string" || !r.banned).
      map(r => typeof r === "string" ? r : r.id);
    switch (operation) {
      case "update": {
        const ogAuthor = originalDoc?.author;
      }
    }
    if (authorData.length > 0) {
      const r = await payload.find({
        collection: "users", where: {
          and: [{
            id: {
              in: authorData
            }
          }, {
            banned: {
              not_equals: true
            }
          }]
        }, showHiddenFields: true, depth: 0, overrideAccess: true, pagination: false, limit: 3
      }).then(s => s.docs as unknown as string[]).catch(re => {
        payload.logger.error(re);
        throw re;
      });
      authorData = [...new Set([...r])];
    }
    if (authorData.length < 1) {
      authorData = [user.id];
    }
    data.author = authorData;
    if (operation === "update") {
      if (data.author.length < 1) {
        if (originalDoc && originalDoc.author && originalDoc.author.length > 0) {
          data.author = originalDoc.author;
        } else {
          if (user) {
            data.author = [user?.id];
          }
        }
      }
    }

    return data;
  }) as CollectionBeforeChangeHook<HasManyAuthorCond<T>>) : (((args: BECH<false>) => {

    const canAuthor = checkAuthorable(hasMany, args);
    const { data, req, operation, originalDoc, collection: { slug: col } } = args;
    if (!canAuthor) {
      throw new Error(`Error in ${col} ${operation}:\tInvalid permissions`);
    }
    const user = req.user;
    if (operation === "create") {
      if (!data.author) {
        if (user) {
          data.author = user?.id;
        }
      }
    }
    if (operation === "update") {
      if (originalDoc && originalDoc.author) {
        data.author = originalDoc.author;
      } else {
        if (user) {
          data.author = user?.id;
        }
      }
    }

    return data;
  }) as CollectionBeforeChangeHook<HasManyAuthorCond<T>>);
};
