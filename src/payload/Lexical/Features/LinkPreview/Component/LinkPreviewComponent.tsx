"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { $getNodeByKey, type NodeKey } from "@payloadcms/richtext-lexical/lexical";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { $isLinkPreviewNode, type LinkPreviewDisplayMode } from "../nodes/LinkPreviewNode";

type OGData = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

type Props = {
  nodeKey: NodeKey;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  displayMode: LinkPreviewDisplayMode;
};

export function LinkPreviewComponent({
  nodeKey,
  url,
  title,
  description,
  image,
  siteName,
  displayMode
}: Props) {
  const [editor] = useLexicalComposerContext();
  const [inputUrl, setInputUrl] = useState(url || "");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: ogData, isLoading } = useQuery<OGData>({
    queryKey: ["link-preview", url],
    queryFn: async () => {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<OGData>;
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2
  });

  // Sync fresh OG data back into the Lexical node so it persists on save
  useEffect(() => {
    if (!ogData || !url) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isLinkPreviewNode(node)) return;
      if (ogData.title != null && ogData.title !== node.getTitle())
        node.setTitle(ogData.title);
      if (ogData.description != null && ogData.description !== node.getDescription())
        node.setDescription(ogData.description);
      if (ogData.image != null && ogData.image !== node.getImage())
        node.setImage(ogData.image);
      if (ogData.siteName != null && ogData.siteName !== node.getSiteName())
        node.setSiteName(ogData.siteName);
    });
  }, [ogData, editor, nodeKey, url]);

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isLinkPreviewNode(node)) node.remove();
    });
  }, [editor, nodeKey]);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputUrl.trim();
      if (!trimmed) return;
      let normalized = trimmed;
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
      }
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isLinkPreviewNode(node)) node.setUrl(normalized);
      });
    },
    [inputUrl, editor, nodeKey]
  );

  // ── Empty URL: show URL entry form ──────────────────────────────────────
  if (!url) {
    return (
      <div
        className="my-3 rounded-sm border border-border/30 p-3.5"
        data-lexical-decorator="true"
        contentEditable={false}
      >
        <form onSubmit={handleUrlSubmit} className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            Link Preview
          </span>
          <input
            ref={inputRef}
            autoFocus
            className="min-w-0 flex-1 border-b border-border/30 bg-transparent pb-1 font-mono text-[11px] placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
            placeholder="https://..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleDelete();
            }}
          />
          <button
            type="submit"
            disabled={!inputUrl.trim()}
            className="shrink-0 border border-border/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground/70 transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 font-mono text-[10px] text-muted-foreground/40 transition-colors hover:text-foreground/70"
            aria-label="Remove"
          >
            ✕
          </button>
        </form>
      </div>
    );
  }

  // Merge serialized node data with fresh OG data (fresh wins)
  const displayTitle = ogData?.title ?? title;
  const displayDescription = ogData?.description ?? description;
  const displayImage = ogData?.image ?? image;
  const displaySiteName = ogData?.siteName ?? siteName;
  const displayHost = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  // ── Compact mode: single-line chip with hover tooltip ─────────────────
  if (displayMode === "compact") {
    return (
      <div
        className="group relative my-1.5 inline-flex"
        data-lexical-decorator="true"
        contentEditable={false}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border/30 px-2.5 py-1 font-mono text-[11px] text-foreground/70 transition-colors hover:border-border/50 hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {displayImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayImage}
              alt=""
              className="h-3.5 w-3.5 rounded-[2px] object-cover opacity-60"
              loading="lazy"
            />
          )}
          <span className="opacity-50">↗</span>
          <span>{displaySiteName ?? displayHost}</span>
          {displayTitle && (
            <span className="max-w-[180px] truncate opacity-70">{displayTitle}</span>
          )}
        </a>

        {/* Hover tooltip */}
        {tooltipVisible && (displayTitle || displayDescription) && (
          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 rounded-sm border border-border/30 bg-background/95 p-3 shadow-lg backdrop-blur-sm">
            {displaySiteName && (
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
                {displaySiteName}
              </p>
            )}
            {displayTitle && (
              <p className="text-[11px] font-medium leading-snug text-foreground/90">
                {displayTitle}
              </p>
            )}
            {displayDescription && (
              <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-muted-foreground/60">
                {displayDescription}
              </p>
            )}
            <p className="mt-1.5 font-mono text-[9px] text-muted-foreground/40">{displayHost}</p>
          </div>
        )}

        <button
          onClick={handleDelete}
          className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-border/30 bg-background font-mono text-[8px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground/70"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Card mode ────────────────────────────────────────────────────────────
  return (
    <div
      className="group relative my-3 overflow-hidden rounded-sm border border-border/20 transition-colors hover:border-border/40"
      data-lexical-decorator="true"
      contentEditable={false}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[72px] items-stretch gap-0 no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3.5 xl:p-4">
          {displaySiteName && (
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
              {displaySiteName}
            </p>
          )}

          {isLoading && !displayTitle ? (
            <div className="h-3.5 w-1/2 animate-pulse rounded-sm bg-muted/30" />
          ) : (
            displayTitle && (
              <p className="line-clamp-2 text-sm font-medium leading-snug tracking-tight text-foreground/90">
                {displayTitle}
              </p>
            )
          )}

          {isLoading && !displayDescription ? (
            <div className="mt-0.5 h-3 w-3/4 animate-pulse rounded-sm bg-muted/20" />
          ) : (
            displayDescription && (
              <p className="line-clamp-2 font-mono text-[10px] leading-relaxed text-muted-foreground/60">
                {displayDescription}
              </p>
            )
          )}

          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/40">{displayHost}</p>
        </div>

        {/* Thumbnail */}
        {displayImage && (
          <div className="relative h-auto w-24 shrink-0 overflow-hidden bg-muted/20 xl:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={displayTitle ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </a>

      {/* Delete control */}
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-sm border border-border/30 bg-background font-mono text-[9px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground/70"
        aria-label="Remove link preview"
      >
        ✕
      </button>
    </div>
  );
}
