"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { TextNode } from "lexical";
import dynamic from "next/dynamic";
import { JSX, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { $createMentionNode } from "@/components/editor/nodes/mention-node";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { UserOverview } from "@/types/collections/posts";
import { useMention } from "../context/mention-context";

const LexicalTypeaheadMenuPlugin = dynamic(
  () => import("./default/lexical-typeahead-menu-plugin"),
  { ssr: false }
);

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ["@"].join("");

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = "[^" + TRIGGERS + PUNC + "\\s]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  " |" + // E.g. " " in "Josh Duck"
  "[" +
  PUNC +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    VALID_JOINS +
    "){0," +
    LENGTH_LIMIT +
    "})" +
    ")$"
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    "){0," +
    ALIAS_LENGTH_LIMIT +
    "})" +
    ")$"
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

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

class MentionTypeaheadOption extends MenuOption {
  name: string;

  image?: string;
  id: string;
  slug: string;

  constructor(mentioned: UserOverview) {
    super(mentioned.slug);
    this.name = mentioned.slug;
    this.image = mentioned.image || undefined;
    this.id = mentioned.id;
    this.slug = mentioned.slug;
  }
}

export function MentionsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const [queryString, setQueryString] = useState<string | null>(null);

  const results = useMention(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0
  });

  const options = useMemo(
    () =>
      results
        ?.map((result) => new MentionTypeaheadOption(result))
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT) || [],
    [results]
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(selectedOption.name, {
          id: selectedOption.id,
          slug: selectedOption.slug,
          image: selectedOption.image
        });
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
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
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
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
                          value={option.name}
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
                            {(option.image && (
                              <AvatarImage
                                height={32}
                                width={32}
                                src={option.image}
                              />
                            )) || (
                              <AvatarFallback className={"uppercase"}>
                                {option.name.at(0)}
                                {option.name.at(1)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {option.name}
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
