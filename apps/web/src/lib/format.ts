/** "0x12ab…cd34" / "123456…7890" — for long hashes and field elements. */
export function shorten(value: string, keep = 6): string {
  return value.length <= keep * 2 + 1 ? value : `${value.slice(0, keep)}…${value.slice(-keep)}`;
}
