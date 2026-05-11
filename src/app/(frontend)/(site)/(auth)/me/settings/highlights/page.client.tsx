"use client";

import { Link } from "@/components/core/Link/Link";
import { RP_Btn } from "@/components/core/Button";
import { errorToast, successToast } from "@/components/ui/sonner";
import {
  ActionButton,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SectionEmpty,
  SubRouteHeader
} from "@/components/UX/Settings";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteCitationAction, setCitationPrivacyAction } from "./actions";
import type { UserCitation } from "./queryUserCitations";
import { RPage } from "@/components/UX/Transition";

interface HighlightsSectionClientProps {
  citations: UserCitation[];
}

export default function HighlightsSectionClient({
  citations
}: HighlightsSectionClientProps) {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <SubRouteHeader
          title="Highlights"
          blurb="Annotations and notes you've made across the site. Toggle visibility, add memos, or remove a highlight."
        />

        {citations.length === 0 ? (
          <SectionEmpty
            eyebrow="Empty shelf"
            title="No highlights yet."
            symbol="“"
            body="When you select text on an essay or surf piece and save it, it'll appear here. You'll be able to revisit, annotate, and share your highlights any time."
            action={
              <Link href="/essays">
                <ActionButton icon={<ArrowUpRight size={12} />}>
                  Browse essays
                </ActionButton>
              </Link>
            }
          />
        ) : (
          <Panel>
            <PanelGrid>
              <PanelHeader
                eyebrow="Highlights"
                title="Annotations and notes"
                blurb="Selections you've saved across The Hideaway. Toggle privacy or remove individual highlights."
                meta={
                  <span className="text-foreground/75 tabular-nums">
                    {String(citations.length).padStart(2, "0")}
                    {citations.length === 50 ? "+" : ""}
                  </span>
                }
              />
              <PanelControls>
                {citations.map((c) => (
                  <CitationRow key={c.id} citation={c} />
                ))}
              </PanelControls>
            </PanelGrid>
          </Panel>
        )}
      </div>
    </RPage>
  );
}

function CitationRow({ citation }: { citation: UserCitation }) {
  const [isPrivate, setIsPrivate] = useState(Boolean(citation.private));
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const togglePrivacy = () => {
    const next = !isPrivate;
    if (!citation.memo && !next) {
      errorToast("Add a memo before making this highlight public.");
      return;
    }
    startTransition(async () => {
      try {
        await setCitationPrivacyAction(citation.id, next);
        setIsPrivate(next);
        successToast(next ? "Made private" : "Made public");
      } catch (e) {
        errorToast(e instanceof Error ? e.message : "Couldn't update privacy");
      }
    });
  };

  const onDelete = () => {
    startDelete(async () => {
      try {
        await deleteCitationAction(citation.id);
        successToast("Highlight removed");
      } catch (e) {
        errorToast(
          e instanceof Error ? e.message : "Couldn't remove highlight"
        );
      }
    });
  };

  const target = citation.target;
  const targetSlug =
    typeof target?.value === "string"
      ? target.value
      : ((target?.value as { slug?: string; id?: string } | undefined)?.slug ??
        (target?.value as { slug?: string; id?: string } | undefined)?.id ??
        "");
  const targetHref =
    target?.relationTo && targetSlug
      ? `/${target.relationTo === "posts" ? "essays" : "surf"}/${targetSlug}`
      : null;

  const updated = citation.updatedAt
    ? new Date(citation.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : null;

  return (
    <div className="rounded-lg bg-foreground/[0.025] px-4 py-4 dark:bg-foreground/[0.03]">
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-3">
          <blockquote className="border-l-2 border-foreground/30 pl-4 text-sm leading-relaxed font-light text-foreground/85 italic">
            {citation.selection?.text ?? citation.quote}
          </blockquote>
          {citation.memo ? (
            <p className="text-xs leading-relaxed text-foreground/65 dark:text-foreground/60">
              — {citation.memo}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/65 dark:text-foreground/60">
            {targetHref ? (
              <Link
                href={targetHref}
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground/85"
              >
                {target?.relationTo === "posts" ? "Essay" : "Surf"}
                <ArrowUpRight size={11} />
              </Link>
            ) : null}
            {updated ? <span>{updated}</span> : null}
            <span
              className={cn(
                isPrivate ? "text-foreground/55" : "text-foreground/65"
              )}
            >
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start">
          <RP_Btn
            onClick={togglePrivacy}
            aria-label={isPrivate ? "Make public" : "Make private"}
            className="flex size-8 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-foreground/[0.06] hover:text-foreground dark:text-foreground/60"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPrivate ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
          </RP_Btn>
          <RP_Btn
            onClick={onDelete}
            aria-label="Delete highlight"
            className="flex size-8 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-foreground/[0.06] hover:text-rouge-700 dark:text-foreground/60"
          >
            {deletePending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </RP_Btn>
        </div>
      </div>
    </div>
  );
}
