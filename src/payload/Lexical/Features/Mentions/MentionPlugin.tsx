"use client";
import { useCallback, useMemo, useState } from "react";
import { $createMentionNode } from "./MentionNode";

import { getPayload, type Where } from "payload";
import configPromise from "@payload-config";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useQuery } from "@tanstack/react-query";
import { stringify } from "qs-esm";
import type { UsersSelect } from "@/payload-types";
import type { User } from "better-auth";
import type { UserOverview } from "@/types/collections/posts";
import { useBasicTypeaheadTriggerMatch } from "@payloadcms/richtext-lexical/lexical/react/LexicalTypeaheadMenuPlugin";
import { MenuOption } from "@payloadcms/richtext-lexical/lexical/react/LexicalTypeaheadMenuPlugin";
import { Avatar } from "@base-ui-components/react";

class MentionOption extends MenuOption {
  __user: UserOverview;

  constructor(user: UserOverview) {
    super(user.slug);
    this.__user = user;
  }
}

function MentionSuggestionItem({
  option,
  isSelected,
  onMouseEnter,
  onClick
}: {
  option: MentionOption;
  isSelected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  const { __user: user } = option;

  return (
    <div
      className={`mention-suggestion-item ${isSelected ? "selected" : ""}`}
      role="option"
      aria-selected={isSelected}
      aria-label={`Mention ${user.slug}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="mention-suggestion-item-image">
        <Avatar.Root>
          <Avatar.Image src={user.image || undefined} alt={user.slug} />
          <Avatar.Fallback>{user.slug.charAt(0).toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
      </div>

      <div className="mention-suggestion-item-text">@{user.slug}</div>
    </div>
  );
}
type UserQueryResponse = {
  docs: UserOverview[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: number | null;
  page: number;
  pagingCounter: number;
  prevPage: number | null;
  totalDocs: number;
  totalPages: number;
};

export function MentionPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryResults, setQueryResults] = useState<UserQueryResponse>({
    docs: [],
    hasNextPage: false,
    hasPrevPage: false,
    page: 0,
    totalDocs: 0,
    totalPages: 0,
    limit: 0,
    pagingCounter: 0,
    nextPage: null,
    prevPage: null
  });
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, isPending } = useQuery({
    queryKey: ["users", query],
    queryFn: async ({ queryKey: [_, query] }) => {
      const where: Where = {
        and: [
          {
            or: [
              {
                slug: {
                  contains: query
                }
              },
              {
                name: {
                  contains: query
                }
              },
              {
                displayUsername: {
                  contains: query
                }
              },
              {
                email: {
                  contains: query
                }
              },
              {
                username: {
                  contains: query
                }
              }
            ]
          },
          {
            banned: {
              not_equals: true
            }
          }
        ]
      };
      const select: UsersSelect = {
        id: true,
        slug: true,
        image: true,
        name: true,
        displayUsername: true
      };
      const limit = 10;
      const queryString = stringify(
        {
          where,
          limit,
          select
        },
        { addQueryPrefix: true }
      );
      const response = await fetch(`/api/users/${queryString}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      return (await response.json()) as UserQueryResponse;
    },
    staleTime: Infinity,
    gcTime: 500,
    refetchOnWindowFocus: false,
    enabled: query.length > 0
  });

  const checkForAtSignMatch = useBasicTypeaheadTriggerMatch("@", {
    minLength: 0
  });
  const [options, setOptions] = useState<MentionOption[]>(
    queryResults.docs.map((user) => new MentionOption(user))
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionOption,
      nodeToReplace: any,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const mentionData = {
          slug: selectedOption.__user.slug,
          name: selectedOption.__user.name,
          image: selectedOption.__user.image,
          id: selectedOption.__user.id
        };

        const mentionNode = $createMentionNode(
          mentionData,
          selectedOption.__user.slug,
          selectedOption.__user.id
        );

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }

        mentionNode.selectNext();
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin
      options={options}
      onQueryChange={onQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={checkForAtSignMatch}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (anchorElementRef.current && options.length) {
          return (
            <div
              className="mention-suggestion-list"
              style={{
                position: "absolute",
                left: anchorElementRef.current.getBoundingClientRect().left,
                top: anchorElementRef.current.getBoundingClientRect().bottom,
                zIndex: 10,
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            >
              {options.map((option, i) => (
                <MentionSuggestionItem
                  key={option.key}
                  option={option}
                  isSelected={selectedIndex === i}
                  onClick={() => {
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(i);
                  }}
                />
              ))}
            </div>
          );
        }
        return null;
      }}
    />
  );
}
