# Copy and Translation Rules

This file is the single source of truth for user-facing text in English and Korean. It overrides older copy, voice,
tone, and narrative guidance elsewhere in the repository.

## Default

Use standard, compact, neutral language unless the user gives explicit copy direction for the specific surface being
changed.

- Prefer the most common product term.
- State only what is known and necessary.
- Use the shortest complete wording that preserves meaning.
- Do not add personality, atmosphere, humour, metaphor, lore, or implied intent.
- Do not make the text sound literary, editorial, luxurious, cinematic, theatrical, conversational, or "on brand" by
  default.
- Visual direction never authorizes stylized writing.
- Existing stylized copy is not a precedent.

## Do Not Invent Explanations

Do not add a reason, promise, timeline, consequence, reassurance, next step, or future state unless it is confirmed by
the product behavior or supplied by the user.

Examples:

| Use                  | Do not add                              |
|----------------------|-----------------------------------------|
| Coming soon.         | We will return when it is ready.        |
| 준비 중입니다.       | 준비가 끝나면 다시 찾아오겠습니다.      |
| Could not save.      | Your work is safe.                      |
| 로그인이 필요합니다. | 안전한 이용을 위해 로그인이 필요합니다. |

A status message normally needs one fact. Add an action only when the user can and should take that action now.

## Standard Content Names

Use ordinary names in copy, schemas, component APIs, translation keys, comments, and documentation:

| Meaning                       | Use                   |
|-------------------------------|-----------------------|
| Main page or section text     | `title` or `headline` |
| Supporting line below a title | `subtitle`            |
| Short explanatory text        | `description`         |
| Short UI identifier           | `label`               |
| Text attached to media        | `caption`             |
| Main prose                    | `body`                |
| Form guidance                 | `helperText`          |

Do not introduce `eyebrow`, `lede`, `dek`, `blurb`, `kicker`, `colophon`, or similar publishing jargon. Treat existing
occurrences as legacy names, not as a convention to copy. Rename them when touching the owning surface if the change is
safe and does not silently break stored data or public APIs. Schema changes must follow the repository migration rules.

## English

- Use standard contemporary English.
- Use sentence case.
- Prefer direct verbs: `Log in`, `Save`, `Share`, `Delete account`, `Try again`.
- Use familiar nouns: `member`, `reader`, `account`, `settings`.
- Avoid exclamation marks, emojis, jokes, rhetorical questions, and greetings unless the surface explicitly requires
  one.
- Error text states the failure. Include a recovery action only when verified.
- Success text confirms the completed action without commentary.

## Korean

- Use standard contemporary Korean product language.
- Use concise noun or verb labels for controls: `로그인`, `저장`, `공유`, `다시 시도`.
- Use neutral `합니다` style for complete sentences.
- Do not translate English style, metaphor, or wordplay. Preserve the factual meaning.
- Avoid `당신`, unnecessary `회원님` or `고객님`, emojis, exclamation marks, and decorative punctuation.
- Do not leave ordinary Korean UI text in English.
- Legal, billing, authentication, permissions, and errors must be literal and conventional.

## Translation Parity

- Add or change English and Korean in the same diff.
- The two languages must carry the same facts, actions, certainty, and scope.
- Do not add context in one language that is absent from the other.
- Natural grammar may differ; meaning may not.
- If source meaning is unclear, do not fill the gap. Ask or use the narrower factual statement.

## Review Checklist

Before shipping user-facing text, verify:

1. Is every claim supported by product behavior or explicit source material?
2. Can any word or sentence be removed without losing required meaning?
3. Is the wording standard rather than branded or stylized?
4. Do English and Korean say the same thing?
5. Are content fields named with ordinary terms?

If any answer is no, revise before shipping.
