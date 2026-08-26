import configPromise from "@payload-config";

import { Pagination } from "@/payload/components/Pagination";
import type { Metadata } from "next/types";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

import { RPage } from "@/components/UX/Transition";
import PageClient from "./page.client";
import type { User } from "@payload-types";

const LIMIT = 24;

type MemberCard = Pick<
  User,
  "id" | "slug" | "name" | "username" | "bio" | "portrait" | "role"
>;

export default async function Page() {
  const users = await getMembers();
  const members = users.docs as MemberCard[];

  return (
    <RPage key={`users_${users.totalPages}`} type="users" slug={["users"]}>
      <PageClient>
        <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  The Residency
                </p>
                <h1 className="text-2xl font-light tracking-tight xl:text-3xl">
                  Members
                </h1>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/60 tabular-nums xl:text-xs">
                {users.totalDocs} {users.totalDocs === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-10 xl:px-10 xl:py-14">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="mb-4 font-mono text-5xl opacity-10">○</span>
              <p className="text-base font-light text-foreground/70">
                No members yet.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-5 2xl:grid-cols-6">
              {members.map((m) => (
                <MemberCardItem key={m.id} user={m} />
              ))}
            </ul>
          )}
        </section>

        {users.totalPages > 1 && users.page && (
          <div className="mx-auto max-w-7xl px-6 pb-16 xl:px-10">
            <Pagination page={users.page} totalPages={users.totalPages} />
          </div>
        )}
      </PageClient>
    </RPage>
  );
}

function MemberCardItem({ user }: { user: MemberCard }) {
  const displayName = user.name ?? user.username ?? user.slug;
  const initial = displayName.charAt(0).toUpperCase();
  const href = `/users/${user.slug}`;

  return (
    <li className="group overflow-hidden rounded-sm border border-border/20 bg-card transition-colors hover:border-border/50">
      <a href={href} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
          {user.portrait ? (
            // Portrait is a URL string on the user record
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.portrait}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-mono text-6xl font-light text-muted-foreground/15 select-none">
                {initial}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="p-3.5 xl:p-4">
          <p className="line-clamp-1 text-sm leading-snug font-medium tracking-tight xl:text-base">
            {displayName}
          </p>
          {user.username && user.username !== displayName && (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/50 xl:text-[11px]">
              @{user.username}
            </p>
          )}
          <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40 uppercase xl:text-[10px]">
            {user.role}
          </p>
        </div>
      </a>
    </li>
  );
}

async function getMembers() {
  "use cache";
  cacheLife("hours");
  cacheTag("users");
  const payload = await getPayload({ config: configPromise });
  return payload.find({
    collection: "users",
    depth: 0,
    limit: LIMIT,
    overrideAccess: true,
    select: {
      slug: true,
      name: true,
      username: true,
      bio: true,
      portrait: true,
      role: true
    },
    where: {
      banned: {
        not_equals: true
      }
    }
  });
}

export function generateMetadata(): Metadata {
  return {
    title: `Members — The Hideaway`
  };
}
