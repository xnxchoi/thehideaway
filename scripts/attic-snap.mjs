import readline from "node:readline";
import { resolve } from "node:path";
import {
  applyKey,
  parseSnapArgs,
  readTree,
  resolveSnapshotFiles,
  selectionMark,
  visibleRows,
  writeSnapshot
} from "./attic-lib.mjs";

const root = resolve(process.env.ATTIC_DIR ?? ".attic");
const args = parseSnapArgs(process.argv.slice(2));

async function pick(tree) {
  if (!process.stdin.isTTY) {
    throw new Error("attic: run in a terminal, or pass paths or --all");
  }
  let expanded = new Set();
  let selected = new Set();
  let cursor = 0;
  let note = "";
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdout.write("\x1b[?25l");

  const render = () => {
    const rows = visibleRows(tree, expanded);
    if (cursor >= rows.length) cursor = Math.max(0, rows.length - 1);
    const height = Math.max(5, (process.stdout.rows ?? 24) - 5);
    const start = Math.max(0, Math.min(cursor - height + 1, Math.max(0, rows.length - height)));
    const lines = ["Attic snapshot", ""];
    if (rows.length === 0) lines.push("  (empty)");
    for (let index = start; index < Math.min(rows.length, start + height); index += 1) {
      const row = rows[index];
      const mark = selectionMark(row.node, selected);
      const pointer = index === cursor ? ">" : " ";
      const twist = row.node.dir ? (expanded.has(row.node.rel) ? "v" : ">") : " ";
      lines.push(
        `${pointer} [${mark}] ${"  ".repeat(row.depth)}${twist} ${row.node.name}`
      );
    }
    lines.push("");
    lines.push(
      "space, enter toggle    arrows or hjkl move and open    a all    s save    q quit"
    );
    if (note) lines.push(note);
    process.stdout.write(`\x1b[2J\x1b[H${lines.join("\n")}\n`);
  };

  const finish = () => {
    process.stdin.setRawMode(false);
    process.stdout.write("\x1b[?25h\x1b[2J\x1b[H");
    process.stdin.off("keypress", onKey);
  };

  const done = new Promise((complete) => {
    function onKey(_chunk, key) {
      const rows = visibleRows(tree, expanded);
      const next = applyKey(
        { rows, cursor, expanded, selected, note, action: null },
        key
      );
      if (next.action === "quit") {
        finish();
        complete(null);
        return;
      }
      if (next.action === "save") {
        if (next.selected.size === 0) {
          note = "nothing selected";
          render();
          return;
        }
        finish();
        complete([...next.selected]);
        return;
      }
      expanded = next.expanded;
      selected = next.selected;
      cursor = next.cursor;
      note = next.note ?? "";
      render();
    }
    process.stdin.on("keypress", onKey);
    render();
  });
  return done;
}

try {
  let files;
  if (args.all || args.paths.length > 0) {
    files = await resolveSnapshotFiles(root, args);
  } else {
    const tree = await readTree(root);
    if (tree.length === 0) {
      console.log("attic: nothing to snapshot");
      process.exit(0);
    }
    files = await pick(tree);
    if (!files) process.exit(0);
  }
  const snapshot = await writeSnapshot(root, files ?? [], {
    name: args.name || null
  });
  if (!snapshot) console.log("attic: nothing selected");
  else console.log(`attic: snapshot ${snapshot.id} (${snapshot.files.length} file(s))`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "attic: snapshot failed");
  process.exit(1);
}
