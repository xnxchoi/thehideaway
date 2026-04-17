import { formatUserHandle } from "@/payload/fields/handle/formatUserHandle";
import { generateName } from "@/utilities/names";
import type { Session, User } from "better-auth";
import type { CollectionConfig } from "payload";
import { getFieldsToSign } from "payload";

export async function prepareUser({
  user,
  userCollection
}: {
  user: User & Record<string, any>;
  userCollection: CollectionConfig;
}) {
  const first = generateName("first"),
    last = generateName("last");
  const newUser = getFieldsToSign({
    collectionConfig: userCollection,
    email: user.email,
    user: {
      verified: false,
      banned: false,
      slug: formatUserHandle(first + last),
      username: first + last,
      role: "user",
      onboarded: false,
      twoFactorEnabled: false,
      firstName: first,
      lastName: last,
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      collection: userCollection.slug as "admins" | "users"
    }
  });

  return newUser as User & Record<string, any>;
}

export async function prepareSession({
  session,
  sessionCollection
}: {
  session: Session & Record<string, any>;
  sessionCollection: CollectionConfig;
}) {
  const filteredSession = getFieldsToSign({
    collectionConfig: sessionCollection,
    email: "",
    user: {
      ...session,
      //@ts-expect-error collectionSlug!
      collection: sessionCollection.slug
    }
  });

  delete filteredSession.email;
  delete filteredSession.collection;
  Object.assign(filteredSession, {
    userId: session.userId
  });

  return filteredSession as Session & Record<string, any>;
}

/**
 * Prepares session data for cookie cache by filtering user and session objects
 * based on the payload configuration's 'saveToJwt' property
 */
export async function prepareSessionData({
  sessionData,
  usersCollection,
  sessionsCollection
}: {
  sessionData: {
    session: Session & Record<string, any>;
    user: User & Record<string, any>;
  };
  usersCollection: CollectionConfig;
  sessionsCollection: CollectionConfig;
}) {
  if (!sessionData || !sessionData.user) return null;

  const newUser = await prepareUser({
    user: sessionData.user,
    userCollection: usersCollection
  });
  const newSession = await prepareSession({
    session: sessionData.session,
    sessionCollection: sessionsCollection
  });

  const newSessionData = {
    session: newSession,
    user: newUser
  };

  return newSessionData;
}
