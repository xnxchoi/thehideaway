import type { Field, FieldAccess, RelationshipField, TypeWithID } from "payload";
import { User } from "@payload-types";

const hasManyUpdateAccess: FieldAccess<TypeWithID & {
  author: (string | User)[]
}> = ({ req, data, id, doc }) => {
  const ctx = req.context;
  const overrideAccess = ctx.overrideAccess;
  if (overrideAccess) {
    return true;
  }
  const user = req.user;
  if (!user) {
    return false;
  }
  if (!doc?.author) {
    if (user?.role === "admin") {
      return true;
    }
    return false;
  }
  if (Array.isArray(doc.author)) {
    if (doc.author.some((v) => (typeof v === "string" ? v : v.id) === user?.id)) {
      return true;
    }
  }

  return false;
};
const hasSingleUpdateAccess: FieldAccess<TypeWithID & {
  author: string | User
}> = ({ req, data, id, doc }) => {
  const ctx = req.context;
  const overrideAccess = ctx.overrideAccess;
  if (overrideAccess) {
    return true;
  }
  const user = req.user;
  if (!user) {
    return false;
  }
  return (user.role === "admin");

};
export const authorFields = (hasMany = false): Field[] => {
  const baseConfig: RelationshipField = {
    name: "author", type: "relationship", relationTo: "users", admin: {
      position: "sidebar"
    }, index: true, maxDepth: 1, hasMany, required: true, access: {
      read: () => true, create: ({ req }) => {
        const ctx = req.context;
        const overrideAccess = ctx.overrideAccess;
        if (overrideAccess) {
          return true;
        }
        const user = req.user;
        if (!user) {
          return false;
        }
        return true;
      }
    }
  };


  baseConfig.access = {
    ...baseConfig.access, update: hasMany ? hasManyUpdateAccess : hasSingleUpdateAccess
  };
  baseConfig.defaultValue = hasMany ? ({ user, req }) => {
    if (!user) return [];
    return [user?.id];
  } : ({ user }) => {
    if (!user) return null;
    return user?.id;
  };
  if (hasMany) {
    baseConfig.maxRows = 3;
  }
  return [baseConfig];
};
