import { Link } from "@/components/core/Link/Link";
import { CheckoutColophon } from "@/components/Shells/Footer/CheckoutColophon";
import "@lostinseoul/index.css";

type LostPaymentStatusShellProps = {
  actionHref: string;
  actionLabel: string;
  eyebrow: string;
  order?: string;
  title: string;
};

export function LostPaymentStatusShell({
  actionHref,
  actionLabel,
  eyebrow,
  order,
  title
}: LostPaymentStatusShellProps) {
  return (
    <main className="lost-standalone-root grid min-h-[100svh] bg-[var(--n-s-bg)] px-4 py-5 text-[var(--n-s-fg)] [--n-s-bg:var(--black)] [--n-s-fg:var(--white)] selection:bg-[var(--n-s-fg)] selection:text-[var(--n-s-bg)] md:px-10 md:py-8">
      <header className="grid min-h-[56px] grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] pb-5">
        <Link
          aria-label="LOSTINSEOUL home"
          className="inline-flex min-h-[44px] items-center font-sans text-sm font-bold tracking-[0.24em] uppercase"
          href="/lostinseoul"
        >
          LOSTINSEOUL
        </Link>
        <p className="pt-3 font-sans text-[11px] font-bold tracking-[0.22em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.62)] uppercase">
          Payment
        </p>
        <span aria-hidden />
      </header>

      <section className="mx-auto grid w-full max-w-3xl content-center justify-items-start py-16 md:py-24">
        <p className="font-sans text-[11px] tracking-[0.22em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.62)] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-[12ch] font-serif text-5xl leading-[0.95] font-bold tracking-tight text-[var(--n-s-fg)] sm:text-6xl md:text-7xl">
          {title}
        </h1>
        {order ? (
          <p className="mt-6 max-w-full font-sans text-xs leading-relaxed tracking-[0.1em] break-all text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.58)] uppercase">
            {order}
          </p>
        ) : null}
        <Link
          className="mt-10 inline-flex min-h-[48px] items-center justify-center rounded-[4px] bg-[var(--n-s-fg)] px-6 text-sm font-medium text-[var(--n-s-bg)]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
        <div className="mt-16 w-full text-[var(--n-s-fg)]">
          <CheckoutColophon />
        </div>
      </section>
    </main>
  );
}
