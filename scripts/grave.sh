#!/usr/bin/env bash
# grave — move files/dirs into .grave/ mirroring their source path.
#
# Convention: .grave/ is the project's tracked trash can. Nothing gets rm'd;
# overlapping-but-dormant code is parked under .grave/<original-path> so it's
# recoverable and the diff always shows a "move", never a "delete".
#
# Usage:
#   pnpm grave <path> [<path> ...]
#
# Example:
#   pnpm grave src/styles/test.tsx
#   -> moves to .grave/src/styles/test.tsx (creates intermediate dirs)

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: pnpm grave <path> [<path> ...]" >&2
  exit 1
fi

# Anchor to repo root so the command works from any CWD.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

for src in "$@"; do
  # Normalize: strip leading ./ and any trailing slash.
  src="${src#./}"
  src="${src%/}"

  if [ ! -e "$src" ]; then
    echo "grave: not found: $src" >&2
    continue
  fi

  # Refuse to grave anything already inside .grave/.
  case "$src" in
    .grave/*|.grave)
      echo "grave: already in .grave: $src" >&2
      continue
      ;;
  esac

  dest=".grave/$src"

  if [ -e "$dest" ]; then
    echo "grave: destination already exists: $dest" >&2
    echo "       resolve manually, or remove the existing grave entry first." >&2
    exit 2
  fi

  mkdir -p "$(dirname "$dest")"
  mv "$src" "$dest"
  echo "grave: $src -> $dest"
done
