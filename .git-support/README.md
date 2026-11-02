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

The current workflow is `pnpm attic <path>` from the checkout that owns the file.
It moves dormant material to the local, Git-ignored `.attic/` while preserving its
source path. Keep active runbooks and handoffs in `readmes/`; never edit or remove
existing attic contents. Review references before archiving a live file.

`archive.mjs`, `archive.json` and their tests are retained legacy tooling for an
`archive/source` branch and `.git-support/archive-worktree/` mount. That catalog
is not populated. They are not the current archival workflow; do not remove them
without separately reviewing hook/tool dependencies. Credential-bearing files
must never enter a publishable archive.
