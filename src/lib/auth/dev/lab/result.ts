export type AuthLabResult = {
  ok: boolean;
  error?: string;
  href?: string;
  assign?: boolean;
  fill?: Record<string, string>;
  secret?: string;
  note?: string;
};
