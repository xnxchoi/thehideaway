"use client";

import { Link } from "@/components/core/Link/Link";
import { RP_Btn } from "@/components/core/Button";
import { RPage } from "@/components/UX/Transition";
import { DataTablePagination } from "../../../../../../components/ui/data-table/data-table-pagination";
import { DataTableToolbar } from "../../../../../../components/ui/data-table/data-table-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/hooks/use-data-table";
import { cn } from "@/lib/utils";
import type { ColumnDef, Header, Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  FileEdit,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useMemo } from "react";
import type { UserPostRow, UserPostStatus } from "./_helpers/queryUserPosts";

type Props = {
  rows: UserPostRow[];
  totalDocs: number;
  pageCount: number;
  counts: { all: number; published: number; draft: number };
  tagOptions: { id: string; title: string }[];
};

// Each column's `cell` is invoked once per row and renders the contents of
// a single <td>. `header` does the same for <th>. We keep the cell/header
// renderers small so the column array reads like the table's schema.

export default function MyPostsClient({
  rows,
  totalDocs,
  pageCount,
  counts,
  tagOptions
}: Props) {
  const columns = useMemo<ColumnDef<UserPostRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select "${row.original.title}"`}
          />
        ),
        size: 36,
        enableSorting: false,
        enableHiding: false
      },
      {
        // Hidden column — toolbar uses it as the free-text input target.
        // We don't render this in <th>/<td>; useDataTable hides it via
        // initial state below.
        id: "q",
        accessorKey: "title",
        meta: {
          label: "Search",
          placeholder: "Search title or subtitle…",
          variant: "text"
        },
        enableColumnFilter: true,
        enableSorting: false
      },
      {
        id: "title",
        accessorKey: "title",
        meta: { label: "Title" },
        header: () => (
          <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
            Title
          </span>
        ),
        cell: ({ row }) => <TitleCell row={row} />,
        enableSorting: false
      },
      {
        id: "status",
        accessorKey: "status",
        meta: {
          label: "Status",
          variant: "multiSelect",
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" }
          ]
        },
        header: () => (
          <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
            Status
          </span>
        ),
        cell: ({ row }) => <StatusCell status={row.original.status} />,
        enableColumnFilter: true,
        enableSorting: true,
        size: 96
      },
      {
        id: "tagged",
        accessorFn: (row) => row.tags.map((t) => t.id),
        meta: {
          label: "Tags",
          variant: "multiSelect",
          options: tagOptions.map((t) => ({ label: t.title, value: t.id }))
        },
        header: () => (
          <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
            Tags
          </span>
        ),
        cell: ({ row }) => <TagsCell tags={row.original.tags} />,
        enableColumnFilter: tagOptions.length > 0,
        enableSorting: false,
        size: 180
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        meta: { label: "Updated", variant: "dateRange" },
        header: () => (
          <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/55 uppercase">
            Updated
          </span>
        ),
        cell: ({ row }) => <UpdatedCell row={row.original} />,
        // Date filter UI is currently broken on BaseUI's PopoverTrigger;
        // re-enable once the fix in data-table-date-filter is verified.
        enableColumnFilter: false,
        enableSorting: true,
        size: 156
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <ActionsCell row={row} />,
        enableSorting: false,
        enableHiding: false,
        size: 196
      }
    ],
    [tagOptions]
  );

  const { table } = useDataTable({
    data: rows,
    columns,
    pageCount,
    getRowId: (row) => row.id,
    // shallow:false makes every URL state change (page, sort, filter)
    // trigger a Next.js server re-render — required for server-driven
    // pagination/filtering. The hook's default is `true`, which leaves
    // the URL updated but never refetches. See use-data-table.ts:78.
    shallow: false,
    initialState: {
      sorting: [{ id: "updatedAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 25 },
      // `q` is filter-only — never render the column itself in <th>/<td>.
      columnVisibility: { q: false }
    }
  });

  const visibleRows = table.getRowModel().rows;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  // Skip the hidden `q` column when iterating header/body cells. We need
  // it in `columns` so the toolbar's text-variant filter input picks it
  // up, but it must never reach <tr>/<td>.
  const visibleColumns = table
    .getAllColumns()
    .filter((c) => c.getIsVisible() && c.id !== "q");

  return (
    <RPage type="me" slug={["posts"]}>
      <div
        className={cn(
          // Dashboard shell — full viewport with asymmetric padding so
          // the SideDrawer/SideNotch peek on lg+ has clearance.
          "w-full pr-6 pl-6 sm:pr-8 sm:pl-8 lg:pr-12 lg:pl-24 xl:pl-32 2xl:pl-40",
          "pt-[5.5rem] pb-24 md:pt-[6.5rem] lg:pt-[8rem] 2xl:pt-[9rem]"
        )}
      >
        <PageMasthead counts={counts} totalDocs={totalDocs} />

        {/* Sticky toolbar — filters live here AND the primary action.
           Stays visible during scroll. */}
        <div
          className={cn(
            "relative z-10 mt-10 xl:mt-14",
            "md:sticky md:top-[5.5rem] lg:top-[7rem] 2xl:top-[8rem]",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px",
            "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px",
            "after:bg-gradient-to-r after:from-transparent after:via-foreground/15 after:to-transparent"
          )}
        >
          <div className="bg-background py-3 md:py-3.5">
            <div className="flex w-full max-w-[1280px] flex-wrap items-center gap-3">
              <PostsToolbar table={table}>
                <Link
                  href="/vault/collections/posts/create"
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md",
                    "px-4 py-2 text-sm font-medium tracking-tight",
                    "bg-foreground/[0.06] text-foreground/90 dark:bg-foreground/[0.08]",
                    "ring-1 ring-foreground/15 transition-colors",
                    "hover:bg-foreground/[0.12] hover:text-foreground hover:ring-foreground/30"
                  )}
                >
                  <span aria-hidden="true" className="text-foreground/70">
                    +
                  </span>
                  New post
                </Link>
              </PostsToolbar>
            </div>
          </div>
        </div>

        {/* Columnar table — Fey Type 1/2 direction. Each property gets
           its own column; the title cell carries thumbnail + title +
           subtitle as a single primary-identifier unit (common table
           idiom). Horizontal scroll on narrow widths rather than
           collapsing to cards. */}
        <div className="mt-2 max-w-[1280px]">
          {visibleRows.length === 0 ? (
            <PostsEmpty
              hasFilters={table.getState().columnFilters.length > 0}
            />
          ) : (
            <div className="-mx-2 overflow-x-auto md:-mx-3">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-foreground/10">
                    {table.getHeaderGroups().map((hg) =>
                      hg.headers
                        .filter((h) => h.column.id !== "q")
                        .map((header) => (
                          <th
                            key={header.id}
                            scope="col"
                            style={
                              header.column.columnDef.size
                                ? { width: header.column.columnDef.size }
                                : undefined
                            }
                            className={cn(
                              "px-[12px] pb-[12px] text-left align-bottom",
                              header.column.id === "select" &&
                                "pr-[4px] pl-[8px]",
                              header.column.id === "actions" && "pr-[8px]"
                            )}
                          >
                            <HeaderCell header={header} />
                          </th>
                        ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <PostRow
                      key={row.id}
                      row={row}
                      index={i}
                      visibleColumnCount={visibleColumns.length}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination + count */}
        {totalDocs > 0 && (
          <div className="mt-8 max-w-[1280px]">
            <DataTablePagination table={table} />
          </div>
        )}

        {/* Bulk action bar — sticky bottom when ≥1 selected. Placeholder
           actions for now; wire to server actions when bulk endpoints
           land. */}
        {selectedCount > 0 && <PostsActionBar table={table} />}
      </div>
    </RPage>
  );
}

// ── Header cell with sort affordance ─────────────────────────────────────────

function HeaderCell<TData>({ header }: { header: Header<TData, unknown> }) {
  const column = header.column;
  const canSort = column.getCanSort();
  const sortState = column.getIsSorted();

  if (!canSort) {
    return (
      <span className="block">
        {flexRender(column.columnDef.header, header.getContext())}
      </span>
    );
  }
  const next =
    sortState === "asc" ? "desc" : sortState === "desc" ? false : "asc";
  return (
    <button
      type="button"
      onClick={() => {
        if (next === false) column.clearSorting();
        else column.toggleSorting(next === "desc");
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-left",
        "transition-colors hover:text-foreground"
      )}
      aria-label={`Sort by ${String(column.columnDef.meta?.label ?? column.id)}`}
    >
      {flexRender(column.columnDef.header, header.getContext())}
      {sortState === "asc" ? (
        <ArrowUp className="size-3 text-foreground/65" aria-hidden="true" />
      ) : sortState === "desc" ? (
        <ArrowDown className="size-3 text-foreground/65" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="size-3 text-foreground/30" aria-hidden="true" />
      )}
    </button>
  );
}

// ── Body row ────────────────────────────────────────────────────────────────

function PostRow({
  row,
  index,
  visibleColumnCount
}: {
  row: Row<UserPostRow>;
  index: number;
  visibleColumnCount: number;
}) {
  const isSelected = row.getIsSelected();
  void visibleColumnCount; // reserved for future colspan affordances

  return (
    <m.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        bounce: 0.1,
        duration: 0.28,
        delay: Math.min(index, 6) * 0.02
      }}
      className={cn(
        "group border-b border-foreground/[0.06] transition-colors",
        "hover:bg-foreground/[0.025] dark:hover:bg-foreground/[0.035]",
        isSelected && "bg-foreground/[0.035] dark:bg-foreground/[0.05]"
      )}
    >
      {row
        .getVisibleCells()
        .filter((c) => c.column.id !== "q")
        .map((cell) => (
          <td
            key={cell.id}
            className={cn(
              "px-[12px] py-[14px] align-middle",
              cell.column.id === "select" && "pr-[4px] pl-[8px]",
              cell.column.id === "title" && "min-w-0",
              cell.column.id === "actions" && "pr-[8px]"
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
    </m.tr>
  );
}

// ── Cell renderers ──────────────────────────────────────────────────────────

function TitleCell({ row }: { row: Row<UserPostRow> }) {
  const post = row.original;
  const isDraft = post.status === "draft";
  const editHref = `/vault/collections/posts/${post.id}`;

  // 10px-rem spacing: explicit [px] for sizing so values match design intent.
  return (
    <div className="flex min-w-0 items-start gap-[14px]">
      <Link
        href={editHref}
        className={cn(
          "relative size-[48px] shrink-0 overflow-hidden rounded-md",
          "bg-foreground/[0.04] dark:bg-foreground/[0.05]"
        )}
        aria-hidden="true"
        tabIndex={-1}
      >
        {post.cover ? (
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            sizes="48px"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-[1.04]",
              isDraft && "opacity-80 mix-blend-luminosity"
            )}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[20px] font-light text-foreground/35">
            {post.title.charAt(0).toUpperCase() || "·"}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-[4px]">
        <Link
          href={editHref}
          className="-my-0.5 block min-w-0 py-0.5 decoration-foreground/30 decoration-[1.5px] underline-offset-[5px] hover:underline"
        >
          <span
            className={cn(
              "block truncate text-[15px] font-medium tracking-tight text-balance",
              isDraft && "text-foreground/85 italic dark:text-foreground/80"
            )}
          >
            {post.title || (
              <span className="text-foreground/45">Untitled draft</span>
            )}
          </span>
        </Link>
        {post.subtitle && (
          <p
            className={cn(
              "max-w-[58ch] truncate text-[13px] leading-snug text-foreground/65 dark:text-foreground/60"
            )}
          >
            {post.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: UserPostStatus }) {
  const isDraft = status === "draft";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] font-sans text-[11px] tracking-[0.16em] uppercase",
        isDraft
          ? "bg-amber-500/10 text-amber-700 ring-1 ring-amber-600/25 dark:text-amber-300/90 dark:ring-amber-300/20"
          : "bg-foreground/[0.06] text-foreground/80 ring-1 ring-foreground/15 dark:bg-foreground/[0.08]"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[6px] rounded-full",
          isDraft ? "bg-amber-600/80 dark:bg-amber-300/80" : "bg-foreground/50"
        )}
      />
      {isDraft ? "Draft" : "Published"}
    </span>
  );
}

function TagsCell({ tags }: { tags: UserPostRow["tags"] }) {
  if (tags.length === 0) {
    return (
      <span className="text-foreground/30" aria-hidden="true">
        —
      </span>
    );
  }
  const visible = tags.slice(0, 2);
  const overflow = tags.length - visible.length;
  return (
    <ul className="flex flex-wrap items-center gap-[6px]">
      {visible.map((t) => (
        <li
          key={t.id}
          className="inline-flex items-center rounded-sm bg-foreground/[0.05] px-[8px] py-[3px] font-sans text-[10px] tracking-[0.14em] text-foreground/70 uppercase dark:bg-foreground/[0.07]"
        >
          {t.title}
        </li>
      ))}
      {overflow > 0 && (
        <li className="font-sans text-[10px] tracking-[0.14em] text-foreground/45 uppercase tabular-nums">
          +{overflow}
        </li>
      )}
    </ul>
  );
}

function UpdatedCell({ row }: { row: UserPostRow }) {
  const isDraft = row.status === "draft";
  const dateLabel = formatDate(
    isDraft ? row.updatedAt : (row.publishedAt ?? row.updatedAt)
  );
  const relative = formatRelative(row.updatedAt);
  return (
    <div className="flex flex-col gap-[3px]">
      <time
        className="font-sans text-[12px] text-foreground/80 tabular-nums"
        dateTime={row.updatedAt}
      >
        {dateLabel}
      </time>
      <span className="font-sans text-[11px] text-foreground/50 tabular-nums">
        {isDraft ? `edited ${relative}` : relative}
      </span>
    </div>
  );
}

function ActionsCell({ row }: { row: Row<UserPostRow> }) {
  const post = row.original;
  const editHref = `/vault/collections/posts/${post.id}`;
  const readHref =
    post.status === "published" && post.slug ? `/essays/${post.slug}` : null;

  // NOTE: project runs a 10px-rem Tailwind theme. `h-9` → 22.5px (not 36px),
  // `text-sm` → 8.75px (not 14px). Use explicit `[px]` arbitrary values
  // where exact dimensions matter — same trick used in CLAUDE.md's
  // legibility-floor guidance.
  return (
    <div className="flex items-center justify-end gap-[6px]">
      {readHref && (
        <Link
          href={readHref}
          className={cn(
            "inline-flex h-[36px] items-center gap-[8px] rounded-md px-[14px] text-[13px] font-medium tracking-tight",
            "text-foreground/75 ring-1 ring-transparent transition-colors",
            "hover:bg-foreground/[0.06] hover:text-foreground hover:ring-foreground/15"
          )}
        >
          <Eye className="size-[16px]" aria-hidden="true" />
          Read
        </Link>
      )}
      <Link
        href={editHref}
        className={cn(
          "inline-flex h-[36px] items-center gap-[8px] rounded-md px-[14px] text-[13px] font-medium tracking-tight",
          "text-foreground/85 ring-1 ring-foreground/15 transition-colors",
          "hover:bg-foreground/[0.06] hover:text-foreground hover:ring-foreground/30"
        )}
      >
        <FileEdit className="size-[16px]" aria-hidden="true" />
        Edit
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <RP_Btn
            aria-label="More actions"
            className={cn(
              "inline-flex size-[36px] items-center justify-center rounded-md",
              "text-foreground/60 ring-1 ring-transparent transition-colors",
              "hover:bg-foreground/[0.06] hover:text-foreground hover:ring-foreground/15"
            )}
          >
            <MoreHorizontal className="size-[18px]" aria-hidden="true" />
          </RP_Btn>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => row.toggleSelected(true)}>
            Select row
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigator.clipboard?.writeText(editHref)}
          >
            Copy edit link
          </DropdownMenuItem>
          {readHref && (
            <DropdownMenuItem
              onSelect={() =>
                navigator.clipboard?.writeText(
                  typeof window !== "undefined"
                    ? `${window.location.origin}${readHref}`
                    : readHref
                )
              }
            >
              Copy public link
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Masthead ─────────────────────────────────────────────────────────────────

function PageMasthead({
  counts,
  totalDocs
}: {
  counts: { all: number; published: number; draft: number };
  totalDocs: number;
}) {
  return (
    <m.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 xl:gap-6"
    >
      <div className="flex items-center gap-4">
        <span className="font-sans text-[10px] tracking-[0.22em] text-foreground/55 uppercase xl:text-[11px]">
          Authorship
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-foreground/20 via-foreground/10 to-transparent"
        />
      </div>

      <div className="flex w-full max-w-[1280px] flex-col gap-3">
        <h1
          className={cn(
            "font-light tracking-tight text-balance",
            "text-6xl md:text-7xl 2xl:text-8xl"
          )}
        >
          Posts<span className="text-foreground/35">.</span>
        </h1>
        <p className="font-sans text-[10px] tracking-[0.18em] text-foreground/45 uppercase xl:text-[11px]">
          {counts.all === 0
            ? "No posts yet"
            : `${counts.all} total · ${counts.published} published · ${counts.draft} draft${counts.draft === 1 ? "" : "s"}`}
          {totalDocs > 0 && totalDocs !== counts.all && (
            <span className="text-foreground/35">
              {" "}
              · {totalDocs} match filters
            </span>
          )}
        </p>
      </div>
    </m.header>
  );
}

// ── Toolbar wrapper ──────────────────────────────────────────────────────────

function PostsToolbar<TData>({
  table,
  children
}: {
  table: Table<TData>;
  children?: React.ReactNode;
}) {
  return (
    <DataTableToolbar
      table={table}
      className="!p-0 [&>div:first-child]:flex-wrap [&>div:first-child]:gap-2"
    >
      {children}
    </DataTableToolbar>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function PostsEmpty({ hasFilters }: { hasFilters: boolean }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col items-start gap-3 rounded-lg",
        "bg-foreground/[0.02] dark:bg-foreground/[0.025]",
        "ring-1 ring-foreground/10",
        "px-6 py-12 lg:px-8 lg:py-16"
      )}
    >
      <p className="text-xl font-light tracking-tight text-foreground/85 xl:text-2xl">
        {hasFilters
          ? "No posts match these filters."
          : "You haven't written anything yet."}
      </p>
      <p className="max-w-prose text-sm text-foreground/65 dark:text-foreground/60">
        {hasFilters
          ? "Reset the filters to see your full library."
          : "Your drafts and published posts will show up on this page."}
      </p>
      {!hasFilters && (
        <Link
          href="/vault/collections/posts/create"
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm tracking-tight",
            "bg-foreground/[0.06] text-foreground/85 dark:bg-foreground/[0.08]",
            "ring-1 ring-foreground/15 transition-colors",
            "hover:bg-foreground/[0.10] hover:text-foreground hover:ring-foreground/30"
          )}
        >
          <span aria-hidden="true" className="text-foreground/55">
            +
          </span>
          Start a draft
        </Link>
      )}
    </m.div>
  );
}

// ── Bulk action bar ──────────────────────────────────────────────────────────

function PostsActionBar<TData>({ table }: { table: Table<TData> }) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className={cn(
        "fixed bottom-6 left-1/2 z-30 -translate-x-1/2",
        "flex items-center gap-3 rounded-md px-4 py-2.5",
        "bg-background/95 backdrop-blur-md",
        "shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)] ring-1 ring-foreground/20",
        "dark:bg-background/95 dark:ring-foreground/25"
      )}
    >
      <span className="font-sans text-[10px] tracking-[0.18em] text-foreground/65 uppercase">
        {selectedCount} selected
      </span>
      <span className="h-4 w-px bg-foreground/15" aria-hidden="true" />
      <RP_Btn
        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs tracking-tight text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        Clear
      </RP_Btn>
      <RP_Btn
        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs tracking-tight text-rouge-700/80 hover:bg-rouge-500/10 hover:text-rouge-600 dark:text-rouge-300/80 dark:hover:text-rouge-200"
        onClick={() => {
          /* TODO: wire bulk delete */
        }}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Delete
      </RP_Btn>
    </m.div>
  );
}

// ── Time formatting ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    .toUpperCase();
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  const wk = 7 * day;
  const yr = 365 * day;

  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < wk) return `${Math.floor(diff / day)}d ago`;
  if (diff < yr) return `${Math.floor(diff / wk)}w ago`;
  return `${Math.floor(diff / yr)}y ago`;
}
