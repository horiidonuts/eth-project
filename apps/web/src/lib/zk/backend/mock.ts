import { randomFieldElement } from "@/lib/field";
import { leafHash, nullifierHash } from "@/lib/merkle/hash";
import { computeRoot } from "@/lib/merkle/tree";
import { mockProofTag } from "@/lib/zk/mock-proof";
import { encodePublicSignals } from "@/lib/zk/public-signals";
import { ProofError, type Groth16Proof, type ProverBackend } from "@/lib/zk/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = () => randomFieldElement().toString();

/**
 * MOCK prover: no cryptography, but it behaves like the real one where the
 * rest of the app can notice — it fails if the voter is not in the tree, its
 * public signals are real values, and it takes a few seconds.
 */
export const mockBackend: ProverBackend = {
  name: "mock",
  async prove(input, onProgress) {
    onProgress({ stage: "loading-artifacts", percent: 10 });
    await delay(500);

    onProgress({ stage: "computing-witness", percent: 35 });
    const id = BigInt(input.idNumber);
    const root = await computeRoot(await leafHash(id), input.merklePath);
    if (root !== BigInt(input.root)) {
      throw new ProofError("NOT_IN_TREE", "Merkle path does not lead to the given root");
    }
    await delay(700);

    onProgress({ stage: "proving", percent: 70 });
    const publicSignals = encodePublicSignals({
      nullifierHash: (await nullifierHash(id, BigInt(input.electionId))).toString(),
      root: input.root,
      electionId: input.electionId,
      candidateId: String(input.candidateId),
    });
    await delay(1000);

    const proof: Groth16Proof = {
      pi_a: [rand(), rand(), "1"],
      pi_b: [
        [rand(), rand()],
        [rand(), rand()],
        ["1", "0"],
      ],
      pi_c: [await mockProofTag(publicSignals), rand(), "1"],
      protocol: "groth16",
      curve: "bn128",
    };
    onProgress({ stage: "done", percent: 100 });
    return { proof, publicSignals };
  },
};
