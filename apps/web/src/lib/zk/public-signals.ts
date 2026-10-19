/**
 * Single source of truth for the order of the circuit's public signals.
 * snarkjs emits outputs first, then public inputs in declaration order.
 * Must match packages/circuits/README.md and IVoting.sol.
 */
export const PUBLIC_SIGNAL_ORDER = ["nullifierHash", "root", "electionId", "candidateId"] as const;

export type VotePublicSignals = Record<(typeof PUBLIC_SIGNAL_ORDER)[number], string>;

export function encodePublicSignals(signals: VotePublicSignals): string[] {
  return PUBLIC_SIGNAL_ORDER.map((name) => signals[name]);
}

export function decodePublicSignals(publicSignals: readonly string[]): VotePublicSignals {
  if (publicSignals.length !== PUBLIC_SIGNAL_ORDER.length) {
    throw new Error(
      `Expected ${PUBLIC_SIGNAL_ORDER.length} public signals, got ${publicSignals.length}`,
    );
  }
  return Object.fromEntries(
    PUBLIC_SIGNAL_ORDER.map((name, i) => [name, publicSignals[i]]),
  ) as VotePublicSignals;
}
