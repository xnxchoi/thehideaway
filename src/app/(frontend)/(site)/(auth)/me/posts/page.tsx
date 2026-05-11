import { currentUser } from "@/lib/auth/context/get-context-props";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { queryUserPosts, type UserPostStatus } from "./_helpers/queryUserPosts";
import MyPostsClient from "./page.client";

export const metadata: Metadata = { title: "Your Posts" };

type SearchParams = Promise<{
  page?: string;
  perPage?: string;
  sort?: string;
  q?: string;
  status?: string;
  tagged?: string;
  updatedAt?: string;
}>;

const STATUS_VALUES: UserPostStatus[] = ["published", "draft"];

const parseSort = (
  raw: string | undefined
): { id: string; desc: boolean }[] | undefined => {
  if (!raw) return undefined;
  // nuqs encodes sort as `column.desc` joined by `.` (per
  // `getSortingStateParser` in `src/lib/parsers.ts`), e.g. `updatedAt.desc`.
  // Be permissive — accept either that or `-updatedAt` shorthand.
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith("-")) return { id: token.slice(1), desc: true };
      const [id, dir] = token.split(".");
      if (id) return { id, desc: dir === "desc" };
      return null;
    })
    .filter((entry): entry is { id: string; desc: boolean } => entry !== null);
};

const parseList = (raw: string | undefined): string[] | undefined => {
  if (!raw) return undefined;
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
};

const parseStatus = (raw: string | undefined): UserPostStatus[] | undefined => {
  const list = parseList(raw);
  if (!list) return undefined;
  const filtered = list.filter((v): v is UserPostStatus =>
    STATUS_VALUES.includes(v as UserPostStatus)
  );
  return filtered.length > 0 ? filtered : undefined;
};

const parseDateRange = (
  raw: string | undefined
): { from?: string; to?: string } => {
  if (!raw) return {};
  const [from, to] = raw.split(",").map((s) => s.trim());
  return {
    from: from && from.length > 0 ? from : undefined,
    to: to && to.length > 0 ? to : undefined
  };
};

export default async function MyPostsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const role = (user as { role?: string }).role ?? "user";
  const canAuthor =
    role === "user" ||
    role === "author" ||
    role === "editor" ||
    role === "admin" ||
    role === "patron";

  if (!canAuthor) return redirect("/me");

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const perPage = Number(sp.perPage ?? 25);
  const sort = parseSort(sp.sort);
  const status = parseStatus(sp.status);
  const tagIds = parseList(sp.tagged);
  const { from: updatedFrom, to: updatedTo } = parseDateRange(sp.updatedAt);

  const bundle = await queryUserPosts({
    page: Number.isFinite(page) ? page : 1,
    perPage: Number.isFinite(perPage) ? perPage : 25,
    sort,
    filters: {
      q: sp.q,
      status,
      tagIds,
      updatedFrom,
      updatedTo
    }
  });

  return (
    <MyPostsClient
      rows={bundle?.rows ?? []}
      totalDocs={bundle?.totalDocs ?? 0}
      pageCount={bundle?.pageCount ?? 0}
      counts={bundle?.counts ?? { all: 0, published: 0, draft: 0 }}
      tagOptions={bundle?.tagOptions ?? []}
    />
  );
}
