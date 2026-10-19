import { groth16 } from "snarkjs";
import { ProofError, type Groth16Proof, type ProverBackend, type VoteProofInput } from "@/lib/zk/types";

/**
 * REAL prover (not active yet; see ./index.ts). Requires the circuit
 * artifacts copied by packages/circuits/scripts/copy-artifacts.sh.
 */
export const CIRCUIT_ARTIFACTS = {
  wasm: "/zk/vote.wasm",
  zkey: "/zk/vote_final.zkey",
} as const;

/** Maps our input onto the circuit's signal names (packages/circuits/README.md). */
export function toCircuitInput(input: VoteProofInput) {
  return {
    idNumber: BigInt(input.idNumber).toString(),
    pathElements: input.merklePath.pathElements,
    pathIndices: input.merklePath.pathIndices.map(String),
    root: input.root,
    electionId: input.electionId,
    candidateId: String(input.candidateId),
  };
}

export const snarkjsBackend: ProverBackend = {
  name: "snarkjs",
  async prove(input, onProgress) {
    // fullProve fetches the artifacts, computes the witness and proves in one
    // call, so progress here is coarse.
    onProgress({ stage: "loading-artifacts", percent: 10 });
    try {
      onProgress({ stage: "proving", percent: 40 });
      const { proof, publicSignals } = await groth16.fullProve(
        toCircuitInput(input),
        CIRCUIT_ARTIFACTS.wasm,
        CIRCUIT_ARTIFACTS.zkey,
      );
      onProgress({ stage: "done", percent: 100 });
      return { proof: proof as Groth16Proof, publicSignals: publicSignals.map(String) };
    } catch (err) {
      // An unsatisfied constraint (e.g. not in the tree) surfaces as a witness error.
      const message = err instanceof Error ? err.message : String(err);
      throw new ProofError("PROVER_FAILED", message);
    }
  },
};
