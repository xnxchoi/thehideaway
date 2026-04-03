"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import {
  createCompilation,
  deleteCompilation,
  type CompilationSummary
} from "@/payload/collections/Compilations/actions";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useRef,
  useState,
  useTransition,
  type FormEvent
} from "react";
import { RP_Btn } from "@/components/core/Button";
import { useTransitionRouter } from "next-transition-router";

type Props = {
  userId: string;
  role: string;
  compilations: CompilationSummary[];
};

const isPremium = (role: string) =>
  ["patron", "author", "editor", "admin"].includes(role);

export default function ListsPageClient({
  userId,
  role,
  compilations: initial
}: Props) {
  const router = useTransitionRouter();
  const [compilations, setCompilations] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const premium = isPremium(role);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await deleteCompilation({ id, userId });
      if ("success" in res) {
        setCompilations((prev) => prev.filter((c) => c.id !== id));
      }
    },
    [userId]
  );

  const handleCreated = useCallback(
    (c: CompilationSummary) => {
      setCompilations((prev) => [c, ...prev]);
      setShowCreate(false);
      router.push(`/me/lists/${c.hashId}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                Curated Collections
              </p>
              <h1 className="mt-0.5 text-2xl font-light tracking-tight xl:text-3xl">
                My Lists
                {compilations.length > 0 && (
                  <span className="ml-2.5 font-mono text-sm text-muted-foreground/50">
                    {compilations.length}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/me/saved"
                className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
              >
                ← Saved
              </Link>
              <RP_Btn
                onClick={() => setShowCreate(true)}
                className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-60 xl:text-xs"
              >
                New List
              </RP_Btn>
            </div>
          </div>
        </div>
      </header>

      {/* ── Grid ───────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8 xl:px-10 xl:py-12">
        <AnimatePresence mode="popLayout">
          {compilations.length === 0 && !showCreate ? (
            <ListsEmptyState key="empty" onNew={() => setShowCreate(true)} />
          ) : (
            <m.div
              key="grid"
              className={cn(
                "grid gap-5 xl:gap-6",
                premium
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {compilations.map((c, i) => (
                <CompilationCard
                  key={c.id}
                  compilation={c}
                  premium={premium}
                  index={i}
                  onDelete={() => handleDelete(c.id)}
                />
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Create Sheet ─────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateCompilationSheet
            userId={userId}
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Compilation Card ─────────────────────────────────────────────────────────

function CompilationCard({
  compilation: c,
  premium,
  index,
  onDelete
}: {
  compilation: CompilationSummary;
  premium: boolean;
  index: number;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", bounce: 0.1, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-sm border border-border/20 bg-card transition-colors hover:border-border/50"
    >
      <Link href={`/me/lists/${c.hashId}`} className="block">
        {/* Cover */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted/20",
            premium ? "aspect-[4/3]" : "aspect-[16/9]"
          )}
        >
          {c.coverImage?.url ? (
            <>
              <Image
                src={c.coverImage.url}
                alt={c.coverImage.alt || c.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <ListPlaceholder title={c.title} />
          )}

          {premium && (
            <div className="absolute inset-x-0 bottom-0 p-4 xl:p-5">
              <h3 className="text-base leading-snug font-medium tracking-tight text-white drop-shadow xl:text-lg">
                {c.title}
              </h3>
              {c.description && (
                <p className="mt-0.5 line-clamp-1 font-mono text-[10px] text-white/60 xl:text-[11px]">
                  {c.description}
                </p>
              )}
            </div>
          )}
        </div>

        {!premium && (
          <div className="p-3.5 xl:p-4">
            <h3 className="text-sm leading-snug font-medium tracking-tight xl:text-base">
              {c.title}
            </h3>
            {c.description && (
              <p className="mt-0.5 line-clamp-1 font-mono text-[10px] text-muted-foreground/60 xl:text-[11px]">
                {c.description}
              </p>
            )}
          </div>
        )}
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/15 px-3.5 py-2 xl:px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground/50 xl:text-[11px]">
            {c.itemCount} {c.itemCount === 1 ? "item" : "items"}
          </span>
          <VisibilityBadge visibility={c.visibility} />
        </div>

        <div className="relative">
          <RP_Btn
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((o) => !o);
            }}
            className="flex h-6 w-6 items-center justify-center font-mono text-sm text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            ···
          </RP_Btn>
          <AnimatePresence>
            {menuOpen && (
              <m.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute top-7 right-0 z-30 min-w-[130px] overflow-hidden rounded-sm border border-border/30 bg-popover shadow-md"
              >
                <Link
                  href={`/me/lists/${c.hashId}`}
                  className="block px-3 py-2 font-mono text-[11px] text-foreground/80 hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit
                </Link>
                {c.visibility === "public" && (
                  <Link
                    href={`/lists/${c.author.slug ?? c.author.id}/${c.hashId}`}
                    className="block px-3 py-2 font-mono text-[11px] text-foreground/80 hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    View public
                  </Link>
                )}
                <RP_Btn
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left font-mono text-[11px] text-destructive hover:bg-accent"
                >
                  Delete
                </RP_Btn>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </m.article>
  );
}

function ListPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
      <span className="font-mono text-7xl font-light text-muted-foreground/10 select-none">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: "public" | "private" }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] tracking-widest uppercase",
        visibility === "public"
          ? "text-muted-foreground/40"
          : "text-muted-foreground/25"
      )}
    >
      {visibility}
    </span>
  );
}

function ListsEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <span className="mb-5 font-mono text-6xl text-foreground/8 select-none">
        ⊞
      </span>
      <p className="text-base font-light text-foreground/70">No lists yet.</p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        Create a curated list to organise and share the things you love.
      </p>
      <RP_Btn
        onClick={onNew}
        className="mt-7 border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
      >
        Create your first list
      </RP_Btn>
    </m.div>
  );
}

// ── Create Sheet ──────────────────────────────────────────────────────────────

function CreateCompilationSheet({
  userId,
  onClose,
  onCreated
}: {
  userId: string;
  onClose: () => void;
  onCreated: (c: CompilationSummary) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const title = titleRef.current?.value?.trim();
      if (!title) return;
      setError(null);

      startTransition(async () => {
        const res = await createCompilation({
          title,
          description: descRef.current?.value?.trim() || undefined,
          visibility,
          userId
        });
        if ("error" in res) {
          setError(res.error);
          return;
        }
        onCreated({
          id: res.id,
          hashId: res.hashId,
          title,
          description: descRef.current?.value?.trim() || null,
          visibility,
          coverImage: null,
          itemCount: 0,
          author: { id: userId, username: null, slug: null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    },
    [userId, visibility, onCreated]
  );

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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        className="fixed inset-x-4 bottom-0 z-50 mx-auto max-w-lg rounded-t-lg border border-border/30 bg-card shadow-2xl sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sm"
      >
        <div className="flex items-center justify-between border-b border-border/20 px-6 py-4">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
            New List
          </p>
          <RP_Btn
            onClick={onClose}
            className="font-mono text-xs text-muted-foreground/50 hover:text-foreground"
          >
            ✕
          </RP_Btn>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                required
                autoFocus
                placeholder="e.g. Late-night reads"
                className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                Description{" "}
                <span className="normal-case opacity-50">(optional)</span>
              </label>
              <textarea
                ref={descRef}
                rows={2}
                placeholder="What's this list about?"
                className="w-full resize-none border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2.5 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                Visibility
              </label>
              <div className="flex gap-5">
                {(["private", "public"] as const).map((v) => (
                  <RP_Btn
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={cn(
                      "flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase transition-opacity",
                      visibility === v
                        ? "opacity-100"
                        : "opacity-35 hover:opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full border transition-colors",
                        visibility === v
                          ? "border-foreground bg-foreground"
                          : "border-border bg-transparent"
                      )}
                    />
                    {v}
                  </RP_Btn>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 font-mono text-[10px] text-destructive">
              {error}
            </p>
          )}

          <div className="mt-7 flex justify-end gap-4">
            <RP_Btn
              type="button"
              onClick={onClose}
              className="font-mono text-[11px] tracking-widest text-muted-foreground/50 uppercase hover:text-foreground"
            >
              Cancel
            </RP_Btn>
            <RP_Btn
              type="submit"
              disabled={isPending}
              className="border border-border/40 px-5 py-2 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
            >
              {isPending ? "Creating…" : "Create"}
            </RP_Btn>
          </div>
        </form>
      </m.div>
    </>
  );
}
