import { User } from "@/payload-types";
import { TextField, Validate, Where } from "payload";

export const validateHandle: Validate<
  User["slug"],
  User,
  User,
  TextField
> = async (value, options) => {
  if (!value) return "No value provided";
  const { overrideAccess, req, data, operation, id } = options;
  const overr = overrideAccess || req.context.overrideAccess;
  const user = req.user as User;
  const payload = req.payload;
  let query: Where = {};
  const queryOr: Where[] = [
    {
      username: {
        equals: value
      }
    },
    {
      slug: {
        equals: value
      }
    }
  ];
  if (operation === "update") {
    if (!id) return "Could not access id of the target user.";
    if (!user && !overr) return "Could not access the current user.";
    if (!overr && user.id !== id && user.role !== "admin")
      return "Unauthorized";
    query = {
      and: [
        {
          id: {
            not_in: [id]
          }
        },
        {
          or: queryOr
        }
      ]
    };
  } else {
    query = {
      or: queryOr
    };
  }
  const res = await payload
    .count({
      collection: "users",
      overrideAccess: true,
      where: query
    })
    .then((r) => r.totalDocs > 0)
    .catch((e) => {
      payload.logger.error({
        message: `Error while checking if handle ${value} exists`,
        error: e
      });
      return true;
    });
  if (res) return "Handle already exists";
  return true;
};
