import "server-only";
import type { TxStatus } from "@/lib/api-schemas";
import { getServerEnv } from "@/server/env";
import { createEthersVotingClient } from "@/server/chain/ethers-voting-client";
import { createMockVotingClient } from "@/server/chain/mock-voting-client";

/**
 * SWAP POINT #4 — everything the relayer and pages need from the chain.
 * CHAIN_MODE=mock → in-memory fake; CHAIN_MODE=rpc → the real contract via ethers.
 */

/** Groth16 proof in the shape `Voting.vote()` takes (see ./calldata.ts). */
export interface SolidityProof {
  pA: [bigint, bigint];
  pB: [[bigint, bigint], [bigint, bigint]];
  pC: [bigint, bigint];
}

export interface VoteSubmission {
  proof: SolidityProof;
  root: bigint;
  nullifierHash: bigint;
  candidateId: bigint;
}

export type TxLookup = { txHash: string; status: TxStatus; blockNumber: number | null } | null;

export interface VotingClient {
  readonly mode: "mock" | "rpc";
  getMerkleRoot(): Promise<bigint>;
  getElectionId(): Promise<bigint>;
  getCandidateCount(): Promise<number>;
  getResults(): Promise<bigint[]>;
  isNullifierUsed(nullifierHash: bigint): Promise<boolean>;
  /** Simulates first; throws ContractRevertError instead of sending a failing tx. */
  submitVote(vote: VoteSubmission): Promise<{ txHash: string }>;
  setMerkleRoot(root: bigint): Promise<{ txHash: string }>;
  getTxStatus(txHash: string): Promise<TxLookup>;
  findVoteTxHash(nullifierHash: bigint): Promise<string | null>;
}

/** The contract rejected the call (custom error name or revert reason). */
export class ContractRevertError extends Error {
  constructor(readonly reason: string) {
    super(`Contract reverted: ${reason}`);
    this.name = "ContractRevertError";
  }
}

// Kept on globalThis so all route bundles (and dev hot reloads) share one
// client — and, in mock mode, one fake chain.
const globalForClient = globalThis as typeof globalThis & { __evoteVotingClient?: VotingClient };

export function getVotingClient(): VotingClient {
  if (!globalForClient.__evoteVotingClient) {
    const env = getServerEnv();
    globalForClient.__evoteVotingClient =
      env.CHAIN_MODE === "rpc" ? createEthersVotingClient(env.rpc) : createMockVotingClient();
  }
  return globalForClient.__evoteVotingClient;
}
