import { ProofError, type ProofProgress, type VoteProof, type VoteProofInput } from "@/lib/zk/types";
import type { WorkerRequest, WorkerResponse } from "@/lib/zk/worker-protocol";

export interface GenerateVoteProofOptions {
  onProgress?: (progress: ProofProgress) => void;
  /** Aborting terminates the worker immediately. */
  signal?: AbortSignal;
}

/**
 * Generates the vote proof in a Web Worker. Browser only — call it from an
 * event handler or effect in a client component.
 * Which prover runs is decided in ./backend/index.ts, not here.
 */
export function generateVoteProof(
  input: VoteProofInput,
  { onProgress, signal }: GenerateVoteProofOptions = {},
): Promise<VoteProof> {
  if (signal?.aborted) {
    return Promise.reject(new ProofError("ABORTED", "Proof generation aborted"));
  }

  const worker = new Worker(new URL("./proof.worker.ts", import.meta.url), { type: "module" });

  return new Promise<VoteProof>((resolve, reject) => {
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      finish();
      reject(new ProofError("ABORTED", "Proof generation aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        onProgress?.(msg.progress);
      } else if (msg.type === "result") {
        finish();
        resolve(msg.proof);
      } else {
        finish();
        reject(new ProofError(msg.code, msg.message));
      }
    };
    worker.onerror = (event) => {
      finish();
      reject(new ProofError("WORKER_CRASHED", event.message || "Proof worker crashed"));
    };

    worker.postMessage({ type: "prove", input } satisfies WorkerRequest);
  });
}
