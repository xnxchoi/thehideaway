"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { classifyPath, type PageGroup } from "./pageGroups";
import {
  clearTransitionDevHistory,
  useTransitionDevHistory,
  type TransitionDevEntry
} from "./transitionDevHistory";

const DEV_PATH_HEADS = new Set(["dev", "dodo", "lexy", "ticks", "coming-soon"]);

function isDevPath(pathname: string): boolean {
  if (!pathname) return false;
  const head = pathname.split("/").filter(Boolean)[0] ?? "";
  return DEV_PATH_HEADS.has(head);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

const GROUP_COLORS: Record<PageGroup, string> = {
  home: "#a3e635",
  "editorial-archive": "#60a5fa",
  "editorial-single": "#22d3ee",
  collections: "#c084fc",
  profile: "#f472b6",
  account: "#fbbf24",
  auth: "#f87171",
  search: "#fde68a",
  radio: "#34d399",
  "lost-commerce": "#fb7185",
  "lost-product": "#f97316",
  static: "#94a3b8",
  system: "#64748b"
};

const TYPE_COLORS: Record<string, string> = {
  CURTAIN: "#f87171",
  FADE: "#a3e635",
  FROM_MENU: "#fbbf24",
  IMMEDIATE: "#94a3b8"
};

type EntryRowProps = { entry: TransitionDevEntry };

function EntryRow({ entry }: EntryRowProps) {
  const { decision } = entry;
  const sameGroup = decision.from.group === decision.to.group;
  return (
    <li
      style={{
        padding: "6px 8px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: "10px",
        lineHeight: 1.45,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }}
      >
        <span
          style={{
            color: TYPE_COLORS[decision.type] ?? "#fff",
            fontWeight: 600,
            letterSpacing: "0.04em"
          }}
        >
          {decision.type}
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>
          {formatTime(entry.ts)}
        </span>
      </div>
      <div
        style={{
          marginTop: 2,
          color: "rgba(255,255,255,0.7)",
          wordBreak: "break-all"
        }}
      >
        <span style={{ color: GROUP_COLORS[decision.from.group] }}>
          {decision.from.group}
        </span>
        <span style={{ opacity: 0.5 }}> · {entry.fromHref}</span>
        <br />
        <span style={{ opacity: 0.5 }}>→ </span>
        <span style={{ color: GROUP_COLORS[decision.to.group] }}>
          {decision.to.group}
        </span>
        <span style={{ opacity: 0.5 }}> · {entry.toHref}</span>
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: "9px",
          color: sameGroup ? "rgba(163,230,53,0.7)" : "rgba(248,113,113,0.8)"
        }}
      >
        {sameGroup ? "same-group" : "cross-group"} · {decision.from.purpose} →{" "}
        {decision.to.purpose}
        {decision.to.authGated ? " · auth-gated" : ""}
      </div>
    </li>
  );
}

export function TransitionDevOverlay() {
  const pathname = usePathname() ?? "/";
  const history = useTransitionDevHistory();
  const [collapsed, setCollapsed] = useState(false);
  const showing = useMemo(() => isDevPath(pathname), [pathname]);
  const currentClassification = useMemo(
    () => classifyPath(pathname),
    [pathname]
  );

  if (!showing) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        width: collapsed ? 180 : 340,
        maxHeight: "min(70vh, 520px)",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10,10,12,0.92)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 6,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        pointerEvents: "auto"
      }}
      data-testid="transition-dev-overlay"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.7)" }}>Transition Debug</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            onClick={clearTransitionDevHistory}
            style={btnStyle}
          >
            clear
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            style={btnStyle}
          >
            {collapsed ? "+" : "–"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div
            style={{
              padding: "8px 10px",
              fontSize: "10px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              lineHeight: 1.5
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.5)" }}>current</div>
            <div style={{ wordBreak: "break-all" }}>
              <span
                style={{
                  color: GROUP_COLORS[currentClassification.group]
                }}
              >
                {currentClassification.group}
              </span>
              <span style={{ opacity: 0.5 }}>
                {" "}
                · {currentClassification.purpose}
                {currentClassification.authGated ? " · auth" : ""}
              </span>
            </div>
            <div style={{ opacity: 0.5, marginTop: 1 }}>{pathname}</div>
          </div>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              overflowY: "auto",
              flex: 1
            }}
          >
            {history.length === 0 ? (
              <li
                style={{
                  padding: "12px 10px",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.4)"
                }}
              >
                No transitions yet. Click a Link to record one.
              </li>
            ) : (
              history.map((entry) => <EntryRow key={entry.id} entry={entry} />)
            )}
          </ol>
        </>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 3,
  padding: "2px 6px",
  fontSize: "9px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  cursor: "pointer",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
};
