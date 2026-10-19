import type { ProofErrorCode, ProofStage } from "@/lib/zk/types";

/** Turkish UI text for prover states. */
export const PROOF_STAGE_LABELS: Record<ProofStage, string> = {
  "loading-artifacts": "Devre dosyaları yükleniyor…",
  "computing-witness": "Tanık (witness) hesaplanıyor…",
  proving: "Sıfır bilgi ispatı üretiliyor…",
  done: "İspat hazır.",
};

export const PROOF_ERROR_MESSAGES: Record<ProofErrorCode, string> = {
  NOT_IN_TREE: "Bu kimlik numarası kayıtlı Merkle yoluyla eşleşmiyor. Kimliği kontrol edin ya da yeniden kayıt olun.",
  ABORTED: "İspat üretimi iptal edildi.",
  WORKER_CRASHED: "İspat üretici beklenmedik şekilde durdu.",
  PROVER_FAILED: "İspat üretilemedi.",
};
