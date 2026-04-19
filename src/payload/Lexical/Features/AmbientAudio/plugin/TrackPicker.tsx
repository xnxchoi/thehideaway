"use client";

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions
} from "@floating-ui/react";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "cmdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AmbientTrackRef, AnchorKind } from "../nodes/types";
import { useAmbientStore } from "../store/ambientStore";
import {
  $insertAnchor,
  $updateGroupTrack,
  createGroupId
} from "../utils/anchors";
import { searchTracks } from "../utils/tracks";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function TrackPicker() {
  const [editor] = useLexicalComposerContext();
  const pickerOpen = useAmbientStore((s) => s.pickerOpen);
  const pickerAnchorEl = useAmbientStore((s) => s.pickerAnchorEl);
  const pickerGroupId = useAmbientStore((s) => s.pickerGroupId);
  const pendingAnchor = useAmbientStore((s) => s.pendingAnchor);
  const pendingGroupId = useAmbientStore((s) => s.pendingGroupId);
  const closePicker = useAmbientStore((s) => s.closePicker);
  const exitSelectMode = useAmbientStore((s) => s.exitSelectMode);
  const setPendingGroupId = useAmbientStore((s) => s.setPendingGroupId);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 160);
  const [results, setResults] = useState<AmbientTrackRef[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: pickerOpen,
    onOpenChange: (open) => {
      if (!open) closePicker();
    },
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate
  });

  useEffect(() => {
    if (pickerAnchorEl) {
      refs.setReference(pickerAnchorEl);
    }
  }, [pickerAnchorEl, refs]);

  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (!pickerOpen) {
      setQuery("");
      setResults([]);
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    searchTracks(debouncedQuery, ac.signal)
      .then((items) => {
        if (!ac.signal.aborted) setResults(items);
      })
      .catch(() => {
        if (!ac.signal.aborted) setResults([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [debouncedQuery, pickerOpen]);

  const handleSelect = useCallback(
    (track: AmbientTrackRef) => {
      if (pickerGroupId) {
        editor.update(() => {
          $updateGroupTrack(pickerGroupId, track);
        });
        closePicker();
        return;
      }

      const groupId = pendingGroupId ?? createGroupId();
      const kind: AnchorKind = pendingAnchor ?? "start";
      editor.update(() => {
        $insertAnchor(kind, groupId, track);
      });
      if (!pendingGroupId) setPendingGroupId(groupId);
      closePicker();
      if (kind === "end") exitSelectMode();
    },
    [
      editor,
      pickerGroupId,
      pendingAnchor,
      pendingGroupId,
      closePicker,
      exitSelectMode,
      setPendingGroupId
    ]
  );

  const items = useMemo(() => results, [results]);

  if (!pickerOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex: 9999,
        width: 320,
        background: "var(--background, #111)",
        border: "1px solid var(--border, #222)",
        borderRadius: 4,
        boxShadow: "0 10px 40px rgba(0,0,0,.35)"
      }}
      {...getFloatingProps()}
    >
      <Command
        shouldFilter={false}
        loop
        label="Track picker"
        className="flex flex-col"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          autoFocus
          placeholder="Search tracks…"
          className="w-full border-b border-border/30 bg-transparent px-3 py-2 font-mono text-[11px] placeholder:text-muted-foreground/40 focus:outline-none"
        />
        <CommandList className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground/60">
              Searching…
            </div>
          ) : null}
          <CommandEmpty className="px-3 py-4 font-mono text-[10px] text-muted-foreground/50">
            No tracks
          </CommandEmpty>
          <CommandGroup>
            {items.map((track) => (
              <CommandItem
                key={track.trackId}
                value={`${track.title ?? ""} ${track.artist ?? ""} ${track.trackId}`}
                onSelect={() => handleSelect(track)}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 aria-selected:bg-accent/60"
              >
                <div
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-sm bg-muted/30"
                  style={
                    track.cover
                      ? {
                          backgroundImage: `url(${track.cover})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-foreground/90">
                    {track.title ?? "Untitled"}
                  </div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground/60">
                    {track.artist ?? "—"}
                    {track.duration
                      ? ` · ${Math.floor(track.duration / 60)}:${String(
                          Math.round(track.duration % 60)
                        ).padStart(2, "0")}`
                      : ""}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>,
    document.body
  );
}
