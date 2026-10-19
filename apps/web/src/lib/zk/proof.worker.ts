import { proverBackend } from "@/lib/zk/backend";
import { ProofError } from "@/lib/zk/types";
import type { WorkerRequest, WorkerResponse } from "@/lib/zk/worker-protocol";

// Runs off the main thread so proving (seconds of CPU with snarkjs) never
// freezes the UI. Started by ./prover.ts; one worker per proof.

// The project's TS lib is "dom", so type the worker scope minimally.
const scope = self as unknown as {
  addEventListener(type: "message", listener: (event: MessageEvent<WorkerRequest>) => void): void;
  postMessage(message: WorkerResponse): void;
};

scope.addEventListener("message", async (event) => {
  if (event.data.type !== "prove") return;
  try {
    const proof = await proverBackend.prove(event.data.input, (progress) =>
      scope.postMessage({ type: "progress", progress }),
    );
    scope.postMessage({ type: "result", proof });
  } catch (err) {
    if (err instanceof ProofError) {
      scope.postMessage({ type: "error", code: err.code, message: err.message });
    } else {
      const message = err instanceof Error ? err.message : String(err);
      scope.postMessage({ type: "error", code: "PROVER_FAILED", message });
    }
  }
});
