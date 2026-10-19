import { SNARK_FIELD } from "@/lib/field";

/**
 * SWAP POINT #2 — the hash used for leaves, tree nodes and the nullifier.
 *
 * MOCK: SHA-256 over 32-byte big-endian inputs, reduced into the BN254 field.
 * It is NOT circuit-friendly. Before using the real circuit, replace
 * `fieldHash` with Poseidon (the same one the circuit uses, e.g. circomlibjs);
 * everything else in the app goes through the helpers below.
 *
 * Isomorphic: works in the browser, in Web Workers and in Node (Web Crypto).
 */
export type FieldHasher = (inputs: readonly bigint[]) => Promise<bigint>;

const mockSha256Hasher: FieldHasher = async (inputs) => {
  const buf = new Uint8Array(inputs.length * 32);
  inputs.forEach((value, i) => {
    let v = value;
    for (let j = 31; j >= 0; j--) {
      buf[i * 32 + j] = Number(v & 0xffn);
      v >>= 8n;
    }
  });
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  let n = 0n;
  for (const b of digest) n = (n << 8n) | BigInt(b);
  return n % SNARK_FIELD;
};

export const fieldHash: FieldHasher = mockSha256Hasher;

/** Leaf of the voter tree: H(idNumber). */
export const leafHash = (idNumber: bigint) => fieldHash([idNumber]);

/** Inner tree node: H(left, right). */
export const nodeHash = (left: bigint, right: bigint) => fieldHash([left, right]);

/** Nullifier: H(idNumber, electionId). Computed inside the circuit for real proofs. */
export const nullifierHash = (idNumber: bigint, electionId: bigint) =>
  fieldHash([idNumber, electionId]);
