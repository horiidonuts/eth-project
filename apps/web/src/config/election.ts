/**
 * Synthetic election configuration shared by the client and the server.
 * Must match the deployed contract (packages/contracts/ignition/modules/Voting.ts)
 * and the circuit (packages/circuits/README.md).
 */

/** Bound into every nullifier, so a proof cannot be replayed in another election. */
export const ELECTION_ID = "1";

/** Merkle tree depth; fixed at circuit compile time. 2^20 ≈ 1M voters. */
export const TREE_DEPTH = 20;

export interface Candidate {
  /** 0-based index used on-chain and in the proof. */
  id: number;
  name: string;
  description: string;
}

export const CANDIDATES: readonly Candidate[] = [
  { id: 0, name: "Aday A", description: "Sentetik aday — test amaçlı." },
  { id: 1, name: "Aday B", description: "Sentetik aday — test amaçlı." },
  { id: 2, name: "Aday C", description: "Sentetik aday — test amaçlı." },
];
