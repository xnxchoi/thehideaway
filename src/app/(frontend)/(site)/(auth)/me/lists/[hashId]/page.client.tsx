"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import {
  addItemToCompilation,
  removeItemFromCompilation,
  updateCompilation,
  type BookmarkItemTyped,
  type CompilationSummary
} from "@/payload/collections/Compilations/actions";
import type { CompilationItemType } from "@/payload/collections/Compilations";
import type { Compilation } from "@/payload-types";
import { AnimatePresence, Reorder } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useOptimistic,
  useRef,
  useState,
  useTransition
} from "react";
import { useTransitionRouter } from "next-transition-router";
import { RP_Btn } from "@/components/core/Button";

const TAB_LABELS: Record<CompilationItemType, string> = {
  posts: "Essays",
  surf: "Surf",
  profile: "Profiles",
  albums: "Albums",
  playlists: "Playlists",
  tracks: "Tracks",
  userMedia: "Media"
};

type CompilationWithItems = Compilation & {
  itemCount: number;
  items: Array<{
    relationTo: CompilationItemType;
    value: string | { id: string; [k: string]: any };
  }>;
};

type Props = {
  compilation: CompilationWithItems;
  userId: string;
  role: string;
  isOwner: boolean;
  bookmarkedItems: { [K in CompilationItemType]?: BookmarkItemTyped[] };
};

const isPremium = (role: string) =>
  ["patron", "author", "editor", "admin"].includes(role);

export default function CompilationDetailClient({
  compilation: initial,
  userId,
  role,
  isOwner,
  bookmarkedItems
}: Props) {
  const router = useTransitionRouter();
  const premium = isPremium(role);
  const [compilation, setCompilation] = useState(initial);
  const [editMode, setEditMode] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  const items = (compilation.items ?? []) as CompilationWithItems["items"];

  const handleRemoveItem = useCallback(
    async (itemId: string, relationTo: string) => {
      const res = await removeItemFromCompilation({
        compilationId: compilation.id,
        itemId,
        relationTo
      });
      if ("success" in res) {
        setCompilation((prev) => {
          const newItems = (prev.items as any[]).filter(
            (item: any) => {
              const id = typeof item.value === "string" ? item.value : item.value?.id;
              return !(id === itemId && item.relationTo === relationTo);
            }
          );
          return { ...prev, items: newItems, itemCount: newItems.length };
        });
      }
    },
    [compilation.id]
  );

  const handleAddItem = useCallback(
    async (item: { relationTo: CompilationItemType; value: string }) => {
      const res = await addItemToCompilation({
        compilationId: compilation.id,
        item
      });
      if ("success" in res) {
        setCompilation((prev) => ({
          ...prev,
          items: [...(prev.items as any[]), item],
          itemCount: (prev.itemCount ?? 0) + 1
        }));
      }
    },
    [compilation.id]
  );

  const handleUpdateMeta = useCallback(
    async (
      patch: Partial<Pick<Compilation, "title" | "description" | "visibility">>
    ) => {
      const res = await updateCompilation({
        id: compilation.id,
        patch
      });
      if ("success" in res) {
        setCompilation((prev) => ({ ...prev, ...patch }));
      }
    },
    [compilation.id]
  );

  const authorObj = compilation.author as any;
  const authorSlug =
    typeof authorObj === "string" ? null : (authorObj?.slug ?? null);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* ── Header / Hero ───────────────────────────────────── */}
      <div className="relative">
        {/* Cover banner */}
        <div className="relative h-44 w-full overflow-hidden bg-muted/20 sm:h-64 xl:h-80 2xl:h-96">
          {(compilation.coverImage as any)?.url ? (
            <>
              <Image
                src={(compilation.coverImage as any).url}
                alt={compilation.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/10">
              <span className="font-mono text-9xl font-light text-muted-foreground/8 select-none">
                {compilation.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Nav bar */}
        <div className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 xl:px-10">
            <Link
              href="/me/lists"
              className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
            >
              ← Lists
            </Link>
            <div className="flex items-center gap-4">
              {isOwner && (
                <>
                  <RP_Btn
                    onClick={() => setAddPanelOpen(true)}
                    className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase underline decoration-dotted underline-offset-4 hover:opacity-60"
                  >
                    + Add
                  </RP_Btn>
                  <RP_Btn
                    onClick={() => setEditMode((e) => !e)}
                    className={cn(
                      "font-mono text-[11px] tracking-widest uppercase transition-opacity",
                      editMode
                        ? "text-foreground"
                        : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {editMode ? "Done" : "Edit"}
                  </RP_Btn>
                </>
              )}
              {compilation.visibility === "public" && authorSlug && (
                <Link
                  href={`/lists/${authorSlug}/${compilation.hashId}`}
                  className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
                >
                  Public view →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Compilation meta */}
        <div className="mx-auto max-w-7xl px-6 pt-5 pb-4 xl:px-10 xl:pt-7 xl:pb-6">
          <CompilationMetaBlock
            compilation={compilation}
            isOwner={isOwner}
            premium={premium}
            onUpdate={handleUpdateMeta}
          />
        </div>
      </div>

      {/* ── Items grid ─────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 pt-4 pb-16 xl:px-10 xl:pt-6 xl:pb-24">
        {items.length === 0 ? (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <span className="mb-4 font-mono text-5xl text-foreground/8 select-none">
              ◫
            </span>
            <p className="font-light text-foreground/60">This list is empty.</p>
            {isOwner && (
              <RP_Btn
                onClick={() => setAddPanelOpen(true)}
                className="mt-5 font-mono text-[11px] tracking-widest text-muted-foreground/50 uppercase underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                Add items from your saved
              </RP_Btn>
            )}
          </m.div>
        ) : (
          <div
            className={cn(
              "grid gap-4 xl:gap-5",
              premium
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const itemId =
                  typeof item.value === "string" ? item.value : item.value.id;
                const itemData =
                  typeof item.value === "string" ? null : item.value;

                return (
                  <CompilationItemCard
                    key={`${item.relationTo}-${itemId}`}
                    index={index}
                    collectionSlug={item.relationTo}
                    itemId={itemId}
                    itemData={itemData}
                    editMode={editMode && isOwner}
                    onRemove={() => handleRemoveItem(itemId, item.relationTo)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Add from bookmarks panel ────────────────────────── */}
      <AnimatePresence>
        {addPanelOpen && (
          <AddFromBookmarksPanel
            bookmarkedItems={bookmarkedItems}
            existingItems={items}
            onAdd={handleAddItem}
            onClose={() => setAddPanelOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Meta block ───────────────────────────────────────────────────────────────

function CompilationMetaBlock({
  compilation,
  isOwner,
  premium,
  onUpdate
}: {
  compilation: CompilationWithItems;
  isOwner: boolean;
  premium: boolean;
  onUpdate: (patch: any) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  if (editing && isOwner) {
    return (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <input
          ref={titleRef}
          defaultValue={compilation.title}
          className="w-full border-b border-border/40 bg-transparent pb-1 text-xl font-light tracking-tight focus:border-foreground/40 focus:outline-none"
          autoFocus
        />
        <textarea
          ref={descRef}
          defaultValue={compilation.description ?? ""}
          rows={2}
          placeholder="Description…"
          className="w-full resize-none border-b border-border/30 bg-transparent pb-1 font-mono text-xs text-muted-foreground focus:border-foreground/40 focus:outline-none"
        />
        <div className="flex items-center gap-4">
          <RP_Btn
            onClick={async () => {
              await onUpdate({
                title: titleRef.current?.value?.trim() || compilation.title,
                description: descRef.current?.value?.trim() || null
              });
              setEditing(false);
            }}
            className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase underline decoration-dotted underline-offset-4 hover:opacity-60"
          >
            Save
          </RP_Btn>
          <RP_Btn
            onClick={() => setEditing(false)}
            className="font-mono text-[11px] text-muted-foreground/50 hover:text-foreground"
          >
            Cancel
          </RP_Btn>
        </div>
      </m.div>
    );
  }

  return (
    <div className="group/meta">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-light tracking-tight xl:text-2xl 2xl:text-3xl">
            {compilation.title}
          </h1>
          {compilation.description && (
            <p className="mt-1 font-mono text-xs text-muted-foreground/60 xl:text-sm">
              {compilation.description}
            </p>
          )}
        </div>
        {isOwner && (
          <RP_Btn
            onClick={() => setEditing(true)}
            className="mt-0.5 font-mono text-[10px] text-muted-foreground/30 opacity-0 transition-opacity group-hover/meta:opacity-100 hover:text-foreground"
          >
            edit
          </RP_Btn>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {compilation.itemCount}{" "}
          {compilation.itemCount === 1 ? "item" : "items"}
        </span>
        <span
          className={cn(
            "font-mono text-[9px] tracking-widest uppercase",
            compilation.visibility === "public"
              ? "text-muted-foreground/40"
              : "text-muted-foreground/25"
          )}
        >
          {compilation.visibility}
        </span>
        {isOwner && (
          <RP_Btn
            onClick={() =>
              onUpdate({
                visibility:
                  compilation.visibility === "public" ? "private" : "public"
              })
            }
            className="font-mono text-[9px] tracking-widest text-muted-foreground/30 uppercase underline decoration-dotted underline-offset-2 hover:text-muted-foreground"
          >
            toggle
          </RP_Btn>
        )}
      </div>
    </div>
  );
}

// ── Item Card ────────────────────────────────────────────────────────────────

function CompilationItemCard({
  index,
  collectionSlug,
  itemId,
  itemData,
  editMode,
  onRemove
}: {
  index: number;
  collectionSlug: CompilationItemType;
  itemId: string;
  itemData: any | null;
  editMode: boolean;
  onRemove: () => void;
}) {
  const title = itemData?.title ?? itemData?.filename ?? "—";
  const imageUrl = itemData?.image?.url ?? itemData?.url ?? null;
  const imageAlt = itemData?.image?.alt ?? itemData?.alt ?? title;

  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.1, delay: index * 0.025 }}
      className="group relative overflow-hidden rounded-sm border border-border/20 bg-card transition-colors hover:border-border/40"
    >
      {/* Remove button */}
      <AnimatePresence>
        {editMode && (
          <m.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onRemove}
            className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 font-mono text-[10px] text-destructive shadow-sm backdrop-blur-sm hover:bg-destructive hover:text-white"
          >
            ✕
          </m.button>
        )}
      </AnimatePresence>

      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-4xl text-muted-foreground/15 select-none">
              {collectionSlug.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="p-2.5 xl:p-3">
        <p className="line-clamp-2 text-xs leading-snug font-medium tracking-tight xl:text-sm">
          {title}
        </p>
        <p className="mt-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/40 uppercase xl:text-[10px]">
          {TAB_LABELS[collectionSlug] ?? collectionSlug}
        </p>
      </div>
    </m.div>
  );
}

// ── Add from bookmarks panel ──────────────────────────────────────────────────

function AddFromBookmarksPanel({
  bookmarkedItems,
  existingItems,
  onAdd,
  onClose
}: {
  bookmarkedItems: { [K in CompilationItemType]?: BookmarkItemTyped[] };
  existingItems: CompilationWithItems["items"];
  onAdd: (item: {
    relationTo: CompilationItemType;
    value: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const allTabs = (Object.keys(TAB_LABELS) as CompilationItemType[]).filter(
    (t) => (bookmarkedItems[t]?.length ?? 0) > 0
  );

  const [activeTab, setActiveTab] = useState<CompilationItemType>(
    allTabs[0] ?? "posts"
  );
  const [adding, setAdding] = useState<string | null>(null);

  const existingSet = new Set(
    existingItems.map((i) => {
      const v = typeof i.value === "string" ? i.value : i.value.id;
      return `${i.relationTo}::${v}`;
    })
  );

  const handleAdd = async (item: BookmarkItemTyped) => {
    const key = `${item.collectionSlug}::${item.id}`;
    if (existingSet.has(key) || adding) return;
    setAdding(key);
    await onAdd({ relationTo: item.collectionSlug, value: item.id });
    existingSet.add(key);
    setAdding(null);
  };

  return (
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <m.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border/30 bg-card shadow-2xl"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border/20 px-5 py-4">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
            Add from Saved
          </p>
          <RP_Btn
            onClick={onClose}
            className="font-mono text-xs text-muted-foreground/50 hover:text-foreground"
          >
            ✕
          </RP_Btn>
        </div>

        {/* Tabs */}
        {allTabs.length > 1 && (
          <div className="flex gap-4 overflow-x-auto border-b border-border/15 px-5 py-3">
            {allTabs.map((t) => (
              <RP_Btn
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "shrink-0 font-mono text-[10px] tracking-widest uppercase transition-colors",
                  activeTab === t
                    ? "text-foreground"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                {TAB_LABELS[t]}
              </RP_Btn>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {allTabs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-[11px] text-muted-foreground/40">
                No saved items yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(bookmarkedItems[activeTab] ?? []).map((item) => {
                const key = `${item.collectionSlug}::${item.id}`;
                const alreadyAdded = existingSet.has(key);
                return (
                  <RP_Btn
                    key={item.id}
                    onClick={() => handleAdd(item)}
                    disabled={alreadyAdded || adding === key}
                    className={cn(
                      "group relative overflow-hidden rounded-sm border text-left transition-all",
                      alreadyAdded
                        ? "cursor-not-allowed border-border/40 opacity-40"
                        : "border-border/20 hover:border-border/60"
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
                      {item.image?.url ? (
                        <Image
                          src={item.image.url}
                          alt={item.image.alt || item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono text-2xl text-muted-foreground/20">
                            {item.collectionSlug.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Added
                          </span>
                        </div>
                      )}
                      {adding === key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            …
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-1 text-[11px] leading-snug font-medium">
                        {item.title}
                      </p>
                    </div>
                  </RP_Btn>
                );
              })}
            </div>
          )}
        </div>
      </m.div>
    </>
  );
}
