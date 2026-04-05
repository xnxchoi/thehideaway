"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch
} from "@payloadcms/richtext-lexical/lexical/react/LexicalTypeaheadMenuPlugin";
import { TextNode, type BaseSelection } from "lexical";
import dynamic from "next/dynamic";
import { JSX, useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { PluginComponentWithAnchor } from "@payloadcms/richtext-lexical";
import { useMention } from "./mention-context";
import { $createMentionNode } from "./nodes/MentionNode";
import type { MentionItem } from "./nodes/types";
import {
  AtSignMentionsRegex,
  AtSignMentionsRegexAliasRegex,
  LENGTH_LIMIT,
  SUGGESTION_LIST_LENGTH_LIMIT
} from "./mention-utils";
const LexicalTypeaheadMenuPlugin = dynamic(
  () => import("./TypeaheadMenuPlugin"),
  { ssr: false }
);
function checkForAtSignMentions(
  text: string,
  minMatchLength: number
): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset

    const maybeLeadingWhitespace = match[1];

    const matchingString = match[3];
    if (matchingString && matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + (maybeLeadingWhitespace?.length ?? 0),
        matchingString,
        replaceableString: match[2] ?? ""
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

class MentionOption extends MenuOption {
  value: string;
  readonly data: MentionItem;
  constructor(data: MentionItem) {
    super(data.name);
    this.value = data.id;
    this.data = data;
  }
}
export function MentionsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const [queryString, setQueryString] = useState<string | null>(null);
  const selectedMenuIndexRef = useRef<number | null>(null);
  const oldSelection = useRef<BaseSelection | null>(null);
  const menuItemLimit = useMemo(() => SUGGESTION_LIST_LENGTH_LIMIT, []);
  const results = useMention(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("@", {
    minLength: 1
  });

  const options = useMemo(
    () =>
      results
        ?.map((result) => new MentionOption(result))
        .slice(0, menuItemLimit) || [],
    [menuItemLimit, results]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode({
          data: selectedOption.data,
          id: selectedOption.data.id
        });
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
          mentionNode.selectNext();
        }
        closeMenu();
      });
    },
    [editor]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );

  return (
    //@ts-expect-error parameter typing could be better implemented, but this does the job... for now
    <LexicalTypeaheadMenuPlugin<MentionOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        return anchorElementRef.current && results?.length
          ? createPortal(
              <div className="fixed w-[200px] rounded-md shadow-md">
                <Command
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIndex(
                        selectedIndex !== null
                          ? (selectedIndex - 1 + options.length) %
                              options.length
                          : options.length - 1
                      );
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedIndex(
                        selectedIndex !== null
                          ? (selectedIndex + 1) % options.length
                          : 0
                      );
                    }
                  }}
                >
                  <CommandList>
                    <CommandGroup>
                      {options.map((option, index) => (
                        <CommandItem
                          key={option.key}
                          value={option.value}
                          onSelect={() => {
                            selectOptionAndCleanUp(option);
                          }}
                          className={`flex items-center gap-2 ${
                            selectedIndex === index
                              ? "bg-accent"
                              : "bg-transparent!"
                          }`}
                        >
                          <Avatar>
                            {(option.data.image && (
                              <AvatarImage
                                height={32}
                                width={32}
                                src={option.data.image}
                              />
                            )) || (
                              <AvatarFallback className={"uppercase"}>
                                {option.data.name.at(0)}
                                {option.data.name.at(1)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{option.data.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
}
export const MentionPlugin: PluginComponentWithAnchor = () => {
  return <MentionsPlugin />;
};
