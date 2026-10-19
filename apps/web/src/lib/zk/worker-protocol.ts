import type { ProofErrorCode, ProofProgress, VoteProof, VoteProofInput } from "@/lib/zk/types";

/** Messages between prover.ts (main thread) and proof.worker.ts. */
export type WorkerRequest = { type: "prove"; input: VoteProofInput };

export type WorkerResponse =
  | { type: "progress"; progress: ProofProgress }
  | { type: "result"; proof: VoteProof }
  | { type: "error"; code: ProofErrorCode; message: string };
