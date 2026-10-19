import { shorten } from "@/lib/format";

/** Long hash / field element, shortened, with the full value on hover. */
export function Mono({ value, keep = 8 }: { value: string; keep?: number }) {
  return (
    <code title={value} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">
      {shorten(value, keep)}
    </code>
  );
}
