import { type SettingsSection } from "./sections";

interface SettingsHeaderProps {
  section: SettingsSection;
}

export const SettingsHeader = ({ section }: SettingsHeaderProps) => {
  return (
    <header className="relative flex flex-col gap-6 pb-10">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[10px] tracking-widest text-foreground/55 tabular-nums">
          {section.number} —
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] text-foreground/60 uppercase">
          {section.label}
        </span>
      </div>
      <h1 className="text-4xl font-light tracking-tight xl:text-5xl 2xl:text-6xl">
        {section.label}
      </h1>
      <p className="max-w-prose text-base leading-relaxed font-light text-foreground/75 xl:text-lg">
        {section.blurb}
      </p>
      {/* Gradient divider — softer than a hairline border */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-foreground/20 via-foreground/8 to-transparent dark:from-foreground/30 dark:via-foreground/12"
      />
    </header>
  );
};
