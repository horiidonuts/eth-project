import "server-only";
import type { VoteRequest } from "@/lib/api-schemas";
import { decodePublicSignals } from "@/lib/zk/public-signals";
import { toSolidityProof } from "@/server/chain/calldata";
import { ContractRevertError, getVotingClient } from "@/server/chain/voting-client";
import { proofVerifier } from "@/server/zk/verifier";

export type RelayResult =
  | { ok: true; txHash: string; nullifierHash: string }
  | { ok: false; status: number; code: string; message: string };

const fail = (status: number, code: string, message: string): RelayResult => ({
  ok: false,
  status,
  code,
  message,
});

// Nullifiers this relayer has already sent a tx for. Until that tx is mined,
// isNullifierUsed() still returns false, so without this a second request for
// the same voter would be sent too, revert on-chain and waste gas.
// Released only if sending fails. Lost on restart (TODO: persist).
const globalForRelayer = globalThis as typeof globalThis & { __evoteClaimed?: Set<bigint> };
const claimed = (globalForRelayer.__evoteClaimed ??= new Set<bigint>());

/**
 * Relayer pipeline for one vote. Every check that can fail cheaply runs
 * before the transaction, so invalid requests never cost the relayer gas.
 */
export async function relayVote({ proof, publicSignals }: VoteRequest): Promise<RelayResult> {
  if (!(await proofVerifier.verify({ proof, publicSignals }))) {
    return fail(422, "INVALID_PROOF", "İspat doğrulanamadı.");
  }

  const signals = decodePublicSignals(publicSignals);
  const nullifierHash = BigInt(signals.nullifierHash);
  const candidateId = BigInt(signals.candidateId);
  const client = getVotingClient();

  const [root, electionId, candidateCount] = await Promise.all([
    client.getMerkleRoot(),
    client.getElectionId(),
    client.getCandidateCount(),
  ]);
  if (root === 0n) {
    return fail(409, "ROOT_NOT_SET", "Seçmen ağacının kökü henüz yayınlanmadı.");
  }
  if (BigInt(signals.electionId) !== electionId) {
    return fail(422, "WRONG_ELECTION", "İspat bu seçim için üretilmemiş.");
  }
  if (BigInt(signals.root) !== root) {
    return fail(422, "STALE_ROOT", "İspat güncel seçmen ağacına ait değil. Yeniden kayıt olun.");
  }
  if (candidateId >= BigInt(candidateCount)) {
    return fail(422, "INVALID_CANDIDATE", "Geçersiz aday.");
  }
  if (claimed.has(nullifierHash) || (await client.isNullifierUsed(nullifierHash))) {
    return fail(409, "ALREADY_VOTED", "Bu seçmen zaten oy kullanmış.");
  }

  claimed.add(nullifierHash);
  try {
    const { txHash } = await client.submitVote({
      proof: toSolidityProof(proof),
      root,
      nullifierHash,
      candidateId,
    });
    return { ok: true, txHash, nullifierHash: signals.nullifierHash };
  } catch (err) {
    claimed.delete(nullifierHash);
    if (err instanceof ContractRevertError) {
      return fail(422, "CONTRACT_REVERTED", `Sözleşme oyu reddetti (${err.reason}).`);
    }
    console.error("[relayer] submitVote failed", err);
    return fail(502, "RELAYER_ERROR", "İşlem zincire gönderilemedi. Daha sonra tekrar deneyin.");
  }
}
