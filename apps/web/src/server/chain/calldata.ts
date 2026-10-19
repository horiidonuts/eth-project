import "server-only";
import type { Groth16Proof } from "@/lib/zk/types";
import type { SolidityProof } from "@/server/chain/voting-client";

/**
 * snarkjs JSON proof → arguments for the Solidity verifier. Same mapping as
 * `snarkjs.groth16.exportSolidityCallData`: drop the projective "1"
 * coordinates and swap each pi_b pair (the verifier expects G2 points in
 * reversed coordinate order).
 */
export function toSolidityProof(proof: Groth16Proof): SolidityProof {
  const b = proof.pi_b;
  return {
    pA: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    pB: [
      [BigInt(b[0][1]), BigInt(b[0][0])],
      [BigInt(b[1][1]), BigInt(b[1][0])],
    ],
    pC: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
  };
}
