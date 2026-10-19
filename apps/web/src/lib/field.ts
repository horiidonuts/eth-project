/** Scalar field of BN254, the curve used by Circom/snarkjs Groth16 proofs. */
export const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const DECIMAL = /^\d{1,78}$/;

/** A field element as a decimal string — the JSON-safe form snarkjs uses. */
export function isFieldString(value: string): boolean {
  return DECIMAL.test(value) && BigInt(value) < SNARK_FIELD;
}

/** Random field element; used only by the mock prover. */
export function randomFieldElement(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n % SNARK_FIELD;
}

/** Synthetic voter IDs are 11 digits. Real T.C. kimlik numbers never start with 0. */
export const ID_NUMBER_PATTERN = /^\d{11}$/;
