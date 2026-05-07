/**
 * Settings primitives.
 *
 * Two generations live here:
 *   - Legacy: SettingsRail*, SettingsHeader, SettingsGroup, SettingsRow,
 *     EditableText, GlassPanel — kept exported during the migration so
 *     in-flight section pages keep compiling. Do not author against these
 *     for new work; reach for the Fey-direction primitives below.
 *   - Fey direction: Panel, PanelGrid, PanelHeader, PanelControls, plus
 *     the typed field family (LockedField / EditableField /
 *     ToggleField / ChoiceField / ActionField / ActionButton). These
 *     match CLAUDE.md "Admin surfaces (Fey direction)".
 */

// Fey-direction primitives (preferred)
export { Panel, PanelGrid, PanelHeader, PanelControls } from "./Panel";
export {
  FieldRow,
  LockedField,
  EditableField,
  ToggleField,
  ChoiceField,
  ActionField,
  ActionButton
} from "./fields";

// Legacy (kept while sections are migrated; will be deleted once nothing
// imports them).
export { SettingsRail, SettingsRailMobile } from "./SettingsRail";
export { SettingsHeader } from "./SettingsHeader";
export { SettingsGroup, SettingsRow } from "./SettingsRow";
export { EditableText } from "./EditableText";
export { SaveStatus, type SaveState } from "./SaveStatus";
export { SectionEmpty } from "./SectionEmpty";
export { EditorialButton } from "./EditorialButton";
export { GlassPanel, type GlassPanelVariant } from "./GlassPanel";
export {
  SETTINGS_SECTIONS,
  getSection,
  type SettingsSection,
  type SettingsSectionSlug
} from "./sections";
