import { fieldHash } from "@/lib/merkle/hash";

/**
 * MOCK ONLY. A mock proof carries H(publicSignals) in pi_c[0], so the mock
 * verifier can detect tampered signals (e.g. a relayer swapping candidateId),
 * which is what a real Groth16 proof guarantees. Delete together with the
 * mock prover/verifier.
 */
export async function mockProofTag(publicSignals: readonly string[]): Promise<string> {
  return (await fieldHash(publicSignals.map(BigInt))).toString();
}
