"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MentionItem } from "../nodes/types";
import {
  $getNodeByKey,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isNodeSelection,
  $isTextNode,
  $setSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import { $isMentionNode } from "../nodes/MentionNode";
import { useLexicalNodeSelection } from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import {
  IS_IOS,
  mergeRegister
} from "@payloadcms/richtext-lexical/lexical/utils";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { stringify } from "qs-esm";
import { useQuery } from "@tanstack/react-query";

type MentionComponentProps = {
  data: MentionItem | string;
  nodeKey: NodeKey;
};

export const MentionComponent = ({ data, nodeKey }: MentionComponentProps) => {
  const [editor] = useLexicalComposerContext();
  const internalRef = useRef<HTMLSpanElement>(null);

  const select = useMemo(
    () => ({ image: true, id: true, name: true, slug: true }),
    []
  );

  const findByIdFn = useCallback(
    async ({ mentionId }: { mentionId: string }) => {
      const res = await fetch(
        `/api/users/${mentionId}${stringify({ select }, { addQueryPrefix: true })}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          }
        }
      );
      if (res.ok) {
        return (await res.json()) as MentionItem;
      }
      throw new Error("Mention find ID API failed");
    },
    [select]
  );

  const { isFetching, isLoading, data: mentionedData } = useQuery({
    initialData: typeof data === "string" ? null : data,
    queryKey: [
      "mention",
      { mentionedId: typeof data === "string" ? data : data.id }
    ],
    enabled: typeof data === "string",
    queryFn: () => findByIdFn({ mentionId: data as string }),
    staleTime: Infinity
  });

  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isMentionNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  const onArrowLeftPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node?.isSelected()) return false;
      let handled = false;
      const nodeToSelect = node.getPreviousSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectEnd();
        handled = true;
      } else if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select();
        handled = true;
      } else if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectNext();
        handled = true;
      } else if (nodeToSelect === null) {
        node.selectPrevious();
        handled = true;
      }
      if (handled) event.preventDefault();
      return handled;
    },
    [nodeKey]
  );

  const onArrowRightPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node?.isSelected()) return false;
      let handled = false;
      const nodeToSelect = node.getNextSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectStart();
        handled = true;
      } else if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select(0, 0);
        handled = true;
      } else if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectPrevious();
        handled = true;
      } else if (nodeToSelect === null) {
        node.selectNext();
        handled = true;
      }
      if (handled) event.preventDefault();
      return handled;
    },
    [nodeKey]
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (
        event.target === internalRef.current ||
        internalRef.current?.contains(event.target as Node)
      ) {
        if (!event.shiftKey) clearSelection();
        setSelected(true);
        return true;
      }
      return false;
    },
    [clearSelection, setSelected]
  );

  const onBlur = useCallback(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node?.isSelected()) return false;
    if (!$isNodeSelection($getSelection())) return false;
    $setSelection(null);
    return false;
  }, [nodeKey]);

  const onSelectionChange = useCallback(() => {
    if (IS_IOS && isSelected) {
      setSelected(false);
      return true;
    }
    return false;
  }, [isSelected, setSelected]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        onArrowLeftPress,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        onArrowRightPress,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        onSelectionChange,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [
    editor,
    onArrowLeftPress,
    onArrowRightPress,
    onClick,
    onDelete,
    onBlur,
    onSelectionChange
  ]);

  if (isLoading || isFetching) {
    return <Skeleton className="inline-block h-4 w-16 align-middle" />;
  }

  if (!mentionedData) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={internalRef}
          data-mention-data={JSON.stringify(mentionedData)}
          data-mention-value={mentionedData.id}
          role="button"
          tabIndex={-1}
          style={{
            backgroundColor: "oklch(from var(--bleu-500) l c h / 0.12)",
            borderColor: "oklch(from var(--bleu-500) l c h / 0.3)",
            ...(isSelected
              ? { outline: "1px solid oklch(from var(--bleu-500) l c h / 0.6)" }
              : {})
          }}
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm border px-1 font-mono text-[11px] text-foreground/80 transition-colors select-none"
        >
          <span className="opacity-50">@</span>
          {mentionedData.name}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-[10px]">
        @{mentionedData.slug ?? mentionedData.name}
      </TooltipContent>
    </Tooltip>
  );
};
