/** Formats a Date as an ISO yyyy-mm-dd string (UTC). */
export function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
