# Git support

This directory contains the repository-only workflows that integrate Git with
the project's media selection and dormant-source archive. It is not an
application feature and production code must not import from it.

## Media selection

The Git index is the selection interface. In WebStorm, multi-select the wanted
files under `public/`, choose **Git > Add**, and commit normally. The pre-commit
hook updates `.git-support/media.json`; no copied path list or second selection
step is required.

- `node .git-support/media.mjs scan` inventories every local `public/` file in the ignored
  `.git-support/media.local.json`.
- `node .git-support/media.mjs sync-staged` reconciles only media already staged in Git.
- `node .git-support/media.mjs audit` verifies the publishable catalog against Git-index blobs.

The hook stages only the publishable catalog. It never selects another media
file, moves content, or deletes local files. Runtime uploads below
`public/users/` are never publishable through this workflow.

## Dormant-source archive

Dormant source will live on the `archive/source` branch and mount at the
ignored `.git-support/archive-worktree/`. The active branch retains only the
bundle catalog and restoration tooling.

`node .git-support/archive.mjs restore <bundle>` is a dry run. Add `--apply` only after reviewing
the collision report. Archive files are copied back to their original paths;
production code never imports from the mounted archive.

The archive is not yet populated. Credential-bearing files must never be
copied into it.
