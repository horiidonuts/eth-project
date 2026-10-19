/**
 * SWAP POINT #1 — the prover used inside the Web Worker.
 *
 * To switch to real proofs:
 *   1. pnpm --filter @evote/circuits circuits:copy   (puts vote.wasm + vote_final.zkey in public/zk/)
 *   2. change the line below to:
 *        export { snarkjsBackend as proverBackend } from "./snarkjs";
 */
export { mockBackend as proverBackend } from "./mock";
