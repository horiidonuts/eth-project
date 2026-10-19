import type { MerklePath } from "@/lib/merkle/tree";

/** Groth16 proof in snarkjs JSON form (decimal strings, projective coordinates). */
export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: "groth16";
  curve: "bn128";
}

/** What generateVoteProof() returns and what the client POSTs to /api/vote. */
export interface VoteProof {
  proof: Groth16Proof;
  /** Order defined in ./public-signals.ts. */
  publicSignals: string[];
}

export interface VoteProofInput {
  /** PRIVATE. 11-digit (synthetic) id number; never leaves the browser. */
  idNumber: string;
  /** PRIVATE. Sibling path from the voter's leaf to `root`. */
  merklePath: MerklePath;
  /** PUBLIC. Merkle root the path leads to (decimal string). */
  root: string;
  /** PUBLIC. Election id (decimal string). */
  electionId: string;
  /** PUBLIC. Chosen candidate, 0-based. */
  candidateId: number;
}

export type ProofStage = "loading-artifacts" | "computing-witness" | "proving" | "done";

export interface ProofProgress {
  stage: ProofStage;
  /** 0–100, approximate. */
  percent: number;
}

export type ProofErrorCode =
  /** The id/path does not lead to the root (the circuit would be unsatisfiable). */
  | "NOT_IN_TREE"
  | "ABORTED"
  | "WORKER_CRASHED"
  | "PROVER_FAILED";

/** A proving implementation. Runs inside the Web Worker. */
export interface ProverBackend {
  readonly name: string;
  prove(input: VoteProofInput, onProgress: (progress: ProofProgress) => void): Promise<VoteProof>;
}

/** Thrown by backends for expected failures; anything else maps to PROVER_FAILED. */
export class ProofError extends Error {
  constructor(
    readonly code: ProofErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProofError";
  }
}
