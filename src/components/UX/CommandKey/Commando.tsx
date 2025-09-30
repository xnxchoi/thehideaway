"use client";
import React, { ReactNode, useEffect, useState } from "react";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { useDebounce } from "@/utilities/useDebounce";
import { useSearchBar } from "@/providers/RP_Pro";
import { useLenis } from "lenis/react";
import { isInternalLink } from "@/utilities/isInternalLink";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { CreditCard, Settings, User } from "lucide-react";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useTransitionRouter } from "next-transition-router";
import { useShallow } from "zustand/shallow";
import type {
  ArticleOverview,
  AuthorOverview
} from "../../../types/collections/posts";
import type {
  CatOverview,
  DeltaOverview,
  TagOverview
} from "../../../types/collections/delta";
import { useQuery } from "@tanstack/react-query";
import type { CollectionSlug } from "payload";

export function Commando() {
  const slug = useRPSession(useShallow((l) => l.slug));

  const value = useSearchBar((l) => l.value);
  const debouncedValue = useDebounce(value);
  const open = useSearchBar((l) => l.open);
  const {
    data: { docs: items, total: count } = { docs: [], total: 0 },
    isLoading: loading,
    isFetching: fetching,
    refetch: refetch,
    isPending: pending,
    isError: error
  } = useQuery({
    queryKey: ["search", { debouncedValue }],
    queryFn: async ({
      queryKey
    }: {
      queryKey: [string, { debouncedValue: string }];
    }) => {
      const debouncedValue = queryKey[1].debouncedValue;
      if (!open || debouncedValue.length < 1) {
        throw new Error("not availabkle");
      }
      const ite = await fetch(
        "/api/search/?q=" + encodeURIComponent(debouncedValue),
        {
          method: "GET"
        }
      );
      if (ite.ok) {
        const a = (await ite.json()) as {
          docs: {
            doc: {
              relationTo: Extract<
                CollectionSlug,
                | "tags"
                | "categories"
                | "users"
                | "articles"
                | "delta"
                | "posts"
                | "pages"
              >;
              value: string;
            };
            content:
              | TagOverview
              | CatOverview
              | AuthorOverview
              | ArticleOverview
              | DeltaOverview;
          }[];
        };
        if (a.docs && a.docs.length > 0) {
          return {
            total: a.docs.length,
            docs: a.docs
          };
        } else {
          throw new Error("not available");
        }
      } else {
        throw new Error("not available");
      }
    },

    enabled: open,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 500
  });

  return (
    <CommandList>
      {(loading && <div>Loading...</div>) ||
        (error && <CommandEmpty>Nothing found :</CommandEmpty>) ||
        (items && count > 0 && (
          <CommandGroup heading="Search Results">
            {items.map((doc) => (
              <LinkedItem
                key={doc.doc.value + "command_doc"}
                doc={doc.doc}
                content={doc.content}
              ></LinkedItem>
            ))}
          </CommandGroup>
        ))}
      <CommandSeparator />
      {slug && (
        <CommandGroup heading="Settings">
          <LinkedCommandItem
            value="profile"
            href={`/users/${slug}`}
            title="Profile"
          >
            <User />
          </LinkedCommandItem>
          <CommandItem>
            <CreditCard />
            <span>Billing</span>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      )}
    </CommandList>
  );
}

function Item({
  children,
  value,
  keywords,
  isCommand = false
}: {
  children: React.ReactNode;
  value: string;
  keywords?: string[];
  isCommand?: boolean;
}) {
  return (
    <CommandItem value={value} keywords={keywords} onSelect={() => {}}>
      {children}
      <span cmdk-raycast-meta="">{isCommand ? "Command" : "Application"}</span>
    </CommandItem>
  );
}

export const LinkedCommandItem = (props: {
  href: string;
  title: string;
  value?: string;
  type?: string;
  children?: ReactNode;
  [x: string]: any;
}) => {
  const { href, title, value, ...rest } = props;
  const lenis = useLenis();
  const router = useTransitionRouter();
  const setOpen = useSearchBar((l) => l.setOpen);
  const url = useVoyageur((l) => l.url);
  const pathName = useVoyageur((l) => l.pathName);
  const isAnchor = href === url || href.startsWith(`${pathName}#`);
  const handleClick = () => {
    setOpen(false);
    if (isAnchor) {
      lenis && lenis.scrollTo(href);
    } else {
      router.push(decodeURIComponent(href));
    }
  };
  return (
    <CommandItem
      data-themed={"color,background-color"}
      value={value ?? href}
      onSelect={handleClick}
    >
      {rest.children}
      {title}
      {rest.type && (
        <div className="rp_tag absolute right-2">
          {rest.type.endsWith("s") ? rest.type.slice(0, -1) : rest.type}
        </div>
      )}
    </CommandItem>
  );
};

export const LinkedItem = (props: {
  doc: {
    relationTo: Extract<
      CollectionSlug,
      "tags" | "categories" | "users" | "articles" | "delta" | "posts" | "pages"
    >;
    value: string;
  };
  content:
    | TagOverview
    | CatOverview
    | AuthorOverview
    | ArticleOverview
    | DeltaOverview;
}) => {
  const { doc, content } = props;

  const href = `${doc.relationTo}/${content.slug}`;
  const isExternal = !isInternalLink(href);

  const internalLinkProps = {
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined
  };
  return (
    <LinkedCommandItem
      href={href}
      title={
        "name" in content
          ? content.name
          : "title" in content
            ? content.title
            : doc.value
      }
      value={doc.value}
      type={doc.relationTo}
      {...internalLinkProps}
    />
  );
};
