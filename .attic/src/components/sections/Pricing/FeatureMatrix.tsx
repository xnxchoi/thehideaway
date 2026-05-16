import s from "./Pricing.module.scss";

type Cell = boolean | string;

const Check = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
    <path
      d="M2 7.4 5.6 11 12 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const Dash = () => (
  <span
    aria-hidden
    style={{ color: "var(--pricing-fg-faint)", fontWeight: 300 }}
  >
    —
  </span>
);

const Mark = ({ v }: { v: Cell }) => {
  if (typeof v === "string") {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--pricing-fg-mute)"
        }}
      >
        {v}
      </span>
    );
  }
  return v ? (
    <span style={{ color: "var(--pricing-mint)" }}>
      <Check />
    </span>
  ) : (
    <Dash />
  );
};

const ROWS: { label: string; guest: Cell; member: Cell; patron: Cell }[] = [
  { label: "Read public essays", guest: true, member: true, patron: true },
  { label: "Comments & bookmarks", guest: true, member: true, patron: true },
  {
    label: "Highlight & memo",
    guest: false,
    member: true,
    patron: true
  },
  {
    label: "Member-locked essays",
    guest: false,
    member: true,
    patron: true
  },
  {
    label: "Patron-locked essays",
    guest: false,
    member: false,
    patron: true
  },
  {
    label: "Drops — priority access",
    guest: false,
    member: false,
    patron: true
  },
  {
    label: "Exclusive events",
    guest: false,
    member: false,
    patron: true
  },
  {
    label: "Quarterly print",
    guest: false,
    member: false,
    patron: true
  }
];

export function FeatureMatrix() {
  return (
    <section
      aria-labelledby="pricing-matrix"
      style={{
        padding: "60px 24px",
        maxWidth: "1180px",
        margin: "0 auto"
      }}
    >
      <header style={{ marginBottom: 28 }}>
        <p className={s.eyebrow} style={{ marginBottom: 8 }}>
          Compare
        </p>
        <h2
          id="pricing-matrix"
          style={{
            fontSize: "clamp(28px, 3vw, 36px)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            margin: 0
          }}
        >
          What's behind each door
        </h2>
      </header>
      <div className={s.featureMatrix}>
        <table>
          <thead>
            <tr>
              <th scope="col">Benefit</th>
              <th scope="col">Guest</th>
              <th scope="col">Member</th>
              <th scope="col">Patron</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>
                  <Mark v={r.guest} />
                </td>
                <td>
                  <Mark v={r.member} />
                </td>
                <td>
                  <Mark v={r.patron} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
