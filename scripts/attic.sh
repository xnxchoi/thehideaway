#!/usr/bin/env bash
# attic — move files/dirs into .attic/ mirroring their source path.
#
# Convention: .attic/ is the project's local, gitignored archive.
# Nothing gets rm'd; overlapping-but-dormant code is parked under
# .attic/<original-path>. Docker, rsync, and tsconfig all exclude it.
#
# Usage:
#   pnpm attic <path> [<path> ...]
#
# Example:
#   pnpm attic src/styles/test.tsx
#   -> moves to .attic/src/styles/test.tsx (creates intermediate dirs)

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: pnpm attic <path> [<path> ...]" >&2
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
    echo "attic: not found: $src" >&2
    continue
  fi

  # Refuse to attic anything already inside .attic/.
  case "$src" in
    .attic/*|.attic)
      echo "attic: already in .attic: $src" >&2
      continue
      ;;
  esac

  dest=".attic/$src"

  if [ -e "$dest" ]; then
    echo "attic: destination already exists: $dest" >&2
    echo "       resolve manually, or remove the existing attic entry first." >&2
    exit 2
  fi

  mkdir -p "$(dirname "$dest")"
  mv "$src" "$dest"
  echo "attic: $src -> $dest"
done
