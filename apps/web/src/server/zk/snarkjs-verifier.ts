import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { groth16 } from "snarkjs";
import type { ProofVerifier } from "@/server/zk/verifier";

/** REAL verifier (not active yet; see ./verifier.ts). */
const VKEY_PATH = path.join(process.cwd(), "src/server/zk/verification_key.json");

let vkey: Promise<object> | undefined;
const loadVerificationKey = () =>
  (vkey ??= readFile(VKEY_PATH, "utf8").then((json) => JSON.parse(json) as object));

export const snarkjsVerifier: ProofVerifier = {
  name: "snarkjs",
  async verify({ proof, publicSignals }) {
    return groth16.verify(await loadVerificationKey(), publicSignals, proof);
  },
};
