import { Credited, Credits } from "@/components/sections/Credits";
import { getPayload } from "payload";
import config from "@payload-config";

import { RPage } from "@/components/UX/Transition";
import {
  authorityToRole,
  roleToAuthority
} from "@/payload/plugins/locker/fields/authority/utils";
import { merge } from "lodash-es";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { cacheLife, cacheTag } from "next/cache";

export default async function TheTeamPage() {
  const teams = await getTheTeam();
  return (
    <RPage type="pages" slug={["the-team"]} theme={"dark"}>
      <Credits people={teams}></Credits>
    </RPage>
  );
}

async function getTheTeam() {
  "use cache";
  cacheLife("hours");
  cacheTag("the-team");
  const payload = await getPayload({ config });
  const users = await payload.find({
    collection: "users",
    overrideAccess: true,
    where: {
      and: [
        {
          emailVerified: {
            not_equals: false
          }
        },
        {
          role: {
            in: ["admin", "patron", "author", "editor"]
          }
        }
      ]
    },
    limit: 100,
    select: {
      slug: true,
      name: true,
      displayUsername: true,
      image: true,
      portrait: true,
      bio: true,
      role: true,
      link: true
    }
  });
  const tt = users.docs.flatMap((person) => {
    false;
    const mRole = () => {
      if (!person.role) return "user";
      if (!["user", "author", "editor", "admin"].includes(person.role))
        return "user";
      const auth = authorityToRole(roleToAuthority(person.role));
      if (auth === "patron") return "user";
      return auth;
    };
    const position = mRole();
    if (position === "guest") return [];
    return {
      name: person.name,
      id: person.id,
      slug: person.slug,
      bio: person.bio,
      role: person.role ?? "user",
      link: person.link ?? `/@${person.slug}`,
      displayUsername: person.displayUsername ?? `@${person.slug}`,
      portrait: person.portrait ?? null,
      image: person.image ?? "/images/default-avatar.png",
      patronage:
        roleToAuthority(person.role ?? ("user" as RP_Roles)) >
        roleToAuthority("editor"),
      position
    };
  });

  const teams: Credited[] = [];
  for (const person of tt) {
    if (person.portrait) {
      const pt = await payload.findByID({
        collection: "userMedia",
        overrideAccess: true,
        id: person.portrait
      });
      const a = merge({}, person, { portrait: pt });
      teams.push(a);
    } else {
      teams.push(merge({}, person, { portrait: null }));
    }
  }
  return teams;
}
