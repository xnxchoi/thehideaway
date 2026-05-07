/**
 * Settings field family — four affordance tiers, each visually distinct.
 *
 * Per CLAUDE.md "Admin surfaces (Fey direction)" → Field affordance tiers:
 *   1. <LockedField>     — read-only; lock glyph; no underline cliché
 *   2. <EditableField>   — deferred-edit; pencil + hairline reveal on hover
 *   3. <ToggleField>/<ChoiceField>  — soft control; iOS switch / radio pills
 *   4. <ActionField>+<ActionButton> — verified action; pill button → modal
 */

export { FieldRow } from "./FieldRow";
export { LockedField } from "./LockedField";
export { EditableField } from "./EditableField";
export { ToggleField, ChoiceField } from "./ToggleField";
export { ActionField, ActionButton } from "./ActionField";
