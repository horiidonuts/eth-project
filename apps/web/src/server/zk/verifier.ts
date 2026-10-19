import "server-only";
import { mockProofTag } from "@/lib/zk/mock-proof";
import type { VoteProof } from "@/lib/zk/types";

/**
 * SWAP POINT #3 — the relayer's off-chain proof check, run before paying gas.
 * The contract verifies again on-chain; this only filters out bad proofs early.
 *
 * To switch to real verification (after circuits:copy has produced
 * ./verification_key.json), change the export at the bottom to:
 *   export { snarkjsVerifier as proofVerifier } from "@/server/zk/snarkjs-verifier";
 */
export interface ProofVerifier {
  readonly name: string;
  verify(proof: VoteProof): Promise<boolean>;
}

/** MOCK: accepts only mock proofs whose tag matches their public signals. */
const mockVerifier: ProofVerifier = {
  name: "mock",
  async verify({ proof, publicSignals }) {
    return proof.pi_c[0] === (await mockProofTag(publicSignals));
  },
};

export const proofVerifier: ProofVerifier = mockVerifier;
