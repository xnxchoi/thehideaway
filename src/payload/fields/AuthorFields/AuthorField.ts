import {DefaultValue, Field, type FieldAccess, RelationshipField} from "payload";

export const AuthorField = (hasMany = false): Field[] => {
  const baseConfig: RelationshipField = {
    name: "author",
    type: "relationship",
    relationTo: "users",
    admin: {
      position: "sidebar"
    },
    index: true,
	  maxDepth: 1,
    hasMany: hasMany,
    required: true
  };
  const hasManyUpdateAccess: FieldAccess = ({ req, data, id, doc }) => {
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
      if (doc.author.some((v: string) => v === user?.id)) {
        return true;
      }
    }

    return false;
  };
  const hasSingleUpdateAccess: FieldAccess = ({ req }) => {
    const ctx = req.context;
    const overrideAccess = ctx.overrideAccess;
    if (overrideAccess) {
      return true;
    }
    const user = req.user;
    if (!user) {
      return false;
    }
    return user.role === "admin";
  };
  baseConfig.access = {
    read: () => true,
    update: hasMany ? hasManyUpdateAccess : hasSingleUpdateAccess,
    create: ({ req }) => {
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
  };
  const defaultValue: DefaultValue = hasMany
    ? ({ user, req }) => {
        if (!user) return [];
        return [user?.id];
      }
    : ({ user }) => {
        if (!user) return null;
        return user?.id;
      };
  baseConfig.defaultValue = defaultValue;
  if (hasMany) {
    baseConfig.maxRows = 3;
  }
  return [baseConfig];
};
