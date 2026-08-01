# Pre-first-launch commerce rule

LOSTINSEOUL commerce remains pre-first-launch until the user says, verbatim,
`we have launched for real`.

Until then:

- Do not preserve unreleased LOSTINSEOUL commerce data or compatibility paths
  unless the user explicitly identifies data that must be preserved.
- Temporary incremental migrations may bring a working database onto the
  current schema.
- During `cut:release`, flatten unreleased commerce migrations as much as
  practical. Preserve only the transition from the last actually released
  schema to the schema being released.
- Do not apply this exception to unrelated Hideaway content or ticket data.

After the exact codeword is provided, delete this file and its link from
[README.md](README.md), then apply the normal append-only,
backwards-compatible migration rules without exception.
