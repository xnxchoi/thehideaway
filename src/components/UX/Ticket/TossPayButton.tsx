"use client";

interface TossPayButtonProps {
  amount: number;
  tossId?: string;
  label?: string;
}

export function TossPayButton({ amount, tossId, label }: TossPayButtonProps) {
  const id = tossId ?? process.env.NEXT_PUBLIC_TOSS_ID ?? "";
  const safeAmount = Math.max(0, Math.floor(amount));
  const href = id
    ? `https://toss.me/${encodeURIComponent(id)}/${safeAmount}`
    : `https://toss.me/`;
  const display = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(safeAmount);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
    >
      {label ?? `Pay with Toss · ${display}`}
    </a>
  );
}
