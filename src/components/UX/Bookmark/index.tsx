"use client";
import { useArticle } from "@/components/UX/Highlightr/providers/ArticleProvider";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { getBookmarkExistance } from "@/payload/collections/Bookmarks/server/getBookmarkExistance";
import { type Bookmark } from "@payload-types";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import {
  ComponentProps,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";
import { Button, MotionBtn } from "../../core/Button";

export type BookmarkProps = {
  articleId: string;
  userId: string;
};
// export const Bookmark = ({
//   article: { value, relationTo }
// }: {
//   article: {
//     value: string;
//     relationTo: NonNullable<BookmarkType["target"]>["relationTo"];
//   };
// }) => {
//   const userId = useRPSession(useShallow((r) => r.id)) as string | null;
//   const bookmarkQuery = useQuery({
//     queryKey: ["bookmark", { value, relationTo, userId }] as [
//       string,
//       {
//         value: string;
//         relationTo: NonNullable<BookmarkType["target"]>["relationTo"];
//         userId: string;
//       }
//     ],
//     queryFn: async (props) =>
//       await getBookmarkExistance({
//         target: {
//           relationTo,
//           value
//         },
//         userId: userId!
//       }),
//     enabled: !!userId
//   });
//   const disabled = bookmarkQuery.isError || bookmarkQuery.isPending;
//   const bookmarked = !disabled && bookmarkQuery.data === true;
//   const bookmarkRef = useRef<HTMLButtonElement>(null);
//
//   return (
//     <Button
//       ref={bookmarkRef}
//       className="m-0 flex h-[20px] w-[20px] items-center justify-center bg-faded-black p-0 disabled:opacity-50"
//       disabled={disabled}
//     >
//       <svg
//         width="15"
//         height="15"
//         viewBox="0 0 15 15"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <path
//           d={bPath({ bookmarked })}
//           fill="currentColor"
//           fillRule="evenodd"
//           clipRule="evenodd"
//         />
//       </svg>
//     </Button>
//   );
// };
// const bPath = (
//   props: {
//     bookmarked?: boolean;
//   } = { bookmarked: false }
// ): ComponentProps<"path">["d"] => {
//   return props.bookmarked
//     ? "M3.5 2C3.22386 2 3 2.22386 3 2.5V13.5C3 13.6818 3.09864 13.8492 3.25762 13.9373C3.41659 14.0254 3.61087 14.0203 3.765 13.924L7.5 11.5896L11.235 13.924C11.3891 14.0203 11.5834 14.0254 11.7424 13.9373C11.9014 13.8492 12 13.6818 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5Z"
//     : "M3 2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.7761 2 12 2.22386 12 2.5V13.5C12 13.6818 11.9014 13.8492 11.7424 13.9373C11.5834 14.0254 11.3891 14.0203 11.235 13.924L7.5 11.5896L3.765 13.924C3.61087 14.0203 3.41659 14.0254 3.25762 13.9373C3.09864 13.8492 3 13.6818 3 13.5V2.5ZM4 3V12.5979L6.97 10.7416C7.29427 10.539 7.70573 10.539 8.03 10.7416L11 12.5979V3H4Z";
// };
export const BookmarkButton = () => {
  const qc = useQueryClient();
  const post = useArticle(useShallow((r) => r.id as null | string));
  const user = useRPSession(useShallow((r) => r.id as null | string));
  const collection = useArticle(useShallow((r) => r.collection));
  const cR = useRef(collection);
  const pR = useRef(post);
  const uR = useRef(user);
  const [disabled, setDisabled] = useState(!user || !post);
  useEffect(() => {
    cR.current = collection;
    pR.current = post;
    setDisabled((r) => r || !collection || !post);
  }, [collection, post]);
  useEffect(() => {
    uR.current = user;
    setDisabled((r) => r || !user);
  }, [user]);
  const [initialized, setInitialized] = useState(false);
  const fetcher = useCallback(async () => {
    const postId = pR.current;
    const userId = uR.current;
    if (!userId) {
      throw new Error("Not found");
    }
    if (!postId) {
      throw new Error("Not found");
    }
    const where: Where = {
      and: [
        {
          "target.value": {
            equals: postId
          }
        },
        {
          user: {
            equals: userId
          }
        }
      ]
    };
    const r = await fetch(
      `/api/bookmarks/count/${stringify({ where }, { addQueryPrefix: true })}`
    );
    if (r.ok) {
      const res = (await r.json()) as {
        totalDocs: number;
      };
      setInitialized(true);
      return res.totalDocs > 0;
    }
    throw new Error("Not found");
  }, []);
  const {
    data: hasBookmark,
    isPending,
    isError,
    isFetching,
    isSuccess
  } = useQuery({
    queryKey: [
      "bookmarks",
      {
        collection: cR.current,
        article: pR.current,
        user: uR.current
      }
    ],
    queryFn: fetcher,
    enabled: !initialized
  });
  const [bookmarked, setBookmarked] = useState(Boolean(hasBookmark));
  useEffect(() => {
    if (!isPending) {
      setBookmarked(hasBookmark || false);
    }
  }, [hasBookmark, isPending, isSuccess, isError]);
  const removeBookmark = useRPSession((r) => r.deleteBookmark);
  const addBookmark = useRPSession((r) => r.addBookmark);
  const hasBookmarkRef = useRef(!!hasBookmark);
  useEffect(() => {
    hasBookmarkRef.current = !!hasBookmark;
  }, [hasBookmark]);
  const dB = useCallback(async () => {
    const postId = pR.current;
    const userId = uR.current;
    if (!userId) {
      return;
    }
    if (!postId) {
      return;
    }
    const where: Where = {
      and: [
        {
          "target.value": {
            equals: postId
          }
        },
        {
          user: {
            equals: userId
          }
        }
      ]
    };
    const args = stringify({ where }, { addQueryPrefix: true });
    const res = await fetch(`/api/bookmarks/${args}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(
        async (r) => (await r.json()) as { docs: Bookmark[]; errors: object[] }
      )
      .then((r) => {
        if (r.docs && r.docs.length > 0) {
          return r.docs[0] as Bookmark;
        }
        return null;
      })
      .catch((e) => {
        console.log(e);
        return null;
      });
    if (res) {
      removeBookmark({
        collection: res.target.relationTo as Bookmark["target"]["relationTo"],
        id: res.target.value as string
      });
      return true;
    }
    return false;
  }, [removeBookmark]);
  const cB = useCallback(async () => {
    const postId = pR.current;
    const userId = uR.current;
    if (!userId) {
      return;
    }
    if (!postId) {
      return;
    }
    const body: Pick<Bookmark, "target" | "user"> = {
      target: {
        value: postId,
        relationTo: cR.current
      },
      user: userId
    };
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(body)
    })
      .then(
        async (r) => (await r.json()) as { doc: Bookmark; message: object[] }
      )
      .then((r) => {
        if (r.doc) {
          return r.doc as Bookmark;
        }
        throw new Error("Failed to create bookmark");
      })
      .catch((e) => {
        console.log(e);
        throw new Error("Failed to create bookmark");
      });
    if (res) {
      addBookmark({
        id: res.target.value as string,
        collection: res.target.relationTo as Bookmark["target"]["relationTo"]
      });
      return true;
    }
    throw new Error("Failed to create bookmark");
  }, [addBookmark]);
  const createBookmark = useMutation({
    mutationFn: cB,
    onSuccess: (res) => {
      if (res) {
        qc.setQueryData(
          [
            "bookmarks",
            {
              collection: cR.current,
              article: pR.current,
              user: uR.current
            }
          ],
          true
        );
      }
    }
  });
  const deleteBoookmark = useMutation({
    mutationFn: dB,
    onSuccess: (res) => {
      if (res) {
        qc.setQueryData(
          [
            "bookmarks",
            {
              collection: cR.current,
              article: pR.current,
              user: uR.current
            }
          ],
          false
        );
      }
    }
  });
  const bookmarkSaveOrDelete: MouseEventHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (hasBookmark) {
        deleteBoookmark.mutate();
      } else {
        createBookmark.mutate();
      }
    },
    [deleteBoookmark, createBookmark, hasBookmark]
  );
  return disabled ? (
    <></>
  ) : (
    <div className={"flex h-8 min-w-8"}>
      <MotionBtn
        transition={{ type: "spring", bounce: 0.4 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{
          scale: 1.1
        }}
        onClick={bookmarkSaveOrDelete}
        className={
          "flex h-full items-center justify-center [&_path]:fill-muted-faded-background/55 [&_path]:stroke-none [&_path]:outline-none dark:[&_path]:fill-muted-faded-foreground/55 [&_svg]:size-8"
        }
        disabled={isFetching || isPending}
      >
        {bookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
      </MotionBtn>
    </div>
  );
};
