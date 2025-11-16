import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  ComponentProps,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
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
import { useIsFocused } from "../../FocusTracker/useIsFocused";
import { stringify } from "qs-esm";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type MentionComponentProps = ComponentProps<"span"> & {
  data: MentionItem | string;
  nodeKey: NodeKey;
};
export const MentionComponent = ({
  data,
  children,
  ref,
  nodeKey,
  ...rest
}: MentionComponentProps) => {
  const [editor] = useLexicalComposerContext();
  const select = useMemo(
    () => ({
      image: true,
      id: true,
      name: true,
      slug: true
    }),
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
        const r = (await res.json()) as MentionItem;
        return r;
      }
      throw new Error("Mention find ID API failed");
    },
    [select]
  );

  const {
    isFetching: isFetchingByID,
    isLoading: isLoadingByID,
    isPending: isPendingByID,
    error: errorByID,
    isError: isErrorByID,
    data: mentionedData
  } = useQuery({
    initialData: typeof data === "string" ? null : data,
    queryKey: [
      {
        mentionedId: typeof data === "string" ? data : undefined
      }
    ],
    enabled: Boolean(typeof data === "string"),
    queryFn: () => findByIdFn({ mentionId: data as string }),
    staleTime: Infinity
  });

  const isEditorFocused = useIsFocused();
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
      if (!node?.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = node.getPreviousSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectEnd();
        handled = true;
      }
      if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select();
        handled = true;
      }
      if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectNext();
        handled = true;
      }
      if (nodeToSelect === null) {
        node.selectPrevious();
        handled = true;
      }
      if (handled) {
        event.preventDefault();
      }
      return handled;
    },
    [nodeKey]
  );
  const onArrowRightPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node?.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = node.getNextSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectStart();
        handled = true;
      }
      if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select(0, 0);
        handled = true;
      }
      if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectPrevious();
        handled = true;
      }
      if (nodeToSelect === null) {
        node.selectNext();
        handled = true;
      }
      if (handled) {
        event.preventDefault();
      }
      return handled;
    },
    [nodeKey]
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (!ref) return false;
      if (typeof ref !== "object") return false;
      if (
        event.target === ref.current ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        ref.current?.contains(event.target as Node)
      ) {
        if (!event.shiftKey) {
          clearSelection();
        }
        setSelected(true);
        return true;
      }
      return false;
    },
    [clearSelection, ref, setSelected]
  );
  const onBlur = useCallback(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node?.isSelected()) {
      return false;
    }

    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return false;
    }

    $setSelection(null);
    return false;
  }, [nodeKey]);

  const onSelectionChange = useCallback(() => {
    if (IS_IOS && isSelected) {
      // needed to keep the cursor in the editor when clicking next to a selected mention
      setSelected(false);
      return true;
    }
    return false;
  }, [isSelected, setSelected]);

  useEffect(() => {
    const unregister = mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
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
    return () => {
      unregister();
    };
  }, [
    editor,
    onArrowLeftPress,
    onArrowRightPress,
    onClick,
    onDelete,
    onBlur,
    onSelectionChange
  ]);
  return isLoadingByID || isFetchingByID || isLoadingByID ? (
    <Skeleton />
  ) : isErrorByID || !mentionedData ? (
    <></>
  ) : (
    <Tooltip>
      <TooltipTrigger
        render={() => (
          <span
            data-mention-data={JSON.stringify(mentionedData)}
            data-mention-value={mentionedData.id}
            role="button"
            {...rest}
            ref={ref}
          >
            {mentionedData?.name}
          </span>
        )}
      />
      <TooltipContent>
        <p>{mentionedData?.name}</p>
      </TooltipContent>
    </Tooltip>
  );
};
