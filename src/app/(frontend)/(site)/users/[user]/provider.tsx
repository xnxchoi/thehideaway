"use client";

import { createContext, useContext } from "react";
import { UserQueryResult } from "@/payload/collections/Users/operations/queryMemberBySlug";

export const UserContext = createContext<UserQueryResult | null>(null);
export const useQueriedUser = () => {
  const user = useContext(UserContext);
  if (!user) {
    return null;
  }
  return user;
};
export const Provider = ({
  children,
  user
}: {
  children: React.ReactNode;
  user: UserQueryResult;
}) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
