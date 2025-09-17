import { BaseFilter, ClientUser } from "payload";

export const hideIfNotAdmin: (args: { user: ClientUser }) => boolean = ({
  user
}) => {
  return user?.role !== "admin";
};
export const filterByCurrentUser: BaseFilter = ({ req, sort, locale }) => {
  const user = req.user;
  if (!user)
    return {
      author: {
        exists: false
      }
    };
  if (user.role === "admin") {
    return null;
  }
  return {
    author: {
      equals: user.id
    }
  };
};
