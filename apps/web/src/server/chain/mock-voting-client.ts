import "server-only";
import { CANDIDATES, ELECTION_ID } from "@/config/election";
import { randomFieldElement } from "@/lib/field";
import {
  ContractRevertError,
  type TxLookup,
  type VotingClient,
} from "@/server/chain/voting-client";

/** Mock txs are "mined" this long after submission, so pending → confirmed is visible. */
const MOCK_CONFIRMATION_MS = 3000;

interface MockTx {
  submittedAt: number;
  blockNumber: number;
}

/**
 * In-memory stand-in for the deployed Voting contract. It enforces the same
 * rules the contract will (root, nullifier, candidate range), so the relayer
 * can be developed against it. State is lost on server restart.
 */
export function createMockVotingClient(): VotingClient {
  let merkleRoot = 0n;
  let blockNumber = 1;
  const usedNullifiers = new Set<bigint>();
  const tallies = CANDIDATES.map(() => 0n);
  const txs = new Map<string, MockTx>();
  const voteTxByNullifier = new Map<bigint, string>();

  const newTx = () => {
    const txHash = `0x${randomFieldElement().toString(16).padStart(64, "0")}`;
    txs.set(txHash, { submittedAt: Date.now(), blockNumber: ++blockNumber });
    return txHash;
  };

  return {
    mode: "mock",
    getMerkleRoot: async () => merkleRoot,
    getElectionId: async () => BigInt(ELECTION_ID),
    getCandidateCount: async () => CANDIDATES.length,
    getResults: async () => [...tallies],
    isNullifierUsed: async (n) => usedNullifiers.has(n),

    async submitVote({ root, nullifierHash, candidateId }) {
      if (merkleRoot === 0n) throw new ContractRevertError("RootNotSet");
      if (root !== merkleRoot) throw new ContractRevertError("UnknownRoot");
      if (usedNullifiers.has(nullifierHash)) throw new ContractRevertError("NullifierAlreadyUsed");
      if (candidateId >= BigInt(tallies.length)) throw new ContractRevertError("InvalidCandidate");
      // Proof verification happens in the real contract; the mock trusts the relayer's check.
      usedNullifiers.add(nullifierHash);
      tallies[Number(candidateId)] += 1n;
      const txHash = newTx();
      voteTxByNullifier.set(nullifierHash, txHash);
      return { txHash };
    },

    async setMerkleRoot(root) {
      merkleRoot = root;
      return { txHash: newTx() };
    },

    async getTxStatus(txHash): Promise<TxLookup> {
      const tx = txs.get(txHash.toLowerCase());
      if (!tx) return null;
      const mined = Date.now() - tx.submittedAt >= MOCK_CONFIRMATION_MS;
      return {
        txHash,
        status: mined ? "confirmed" : "pending",
        blockNumber: mined ? tx.blockNumber : null,
      };
    },

    findVoteTxHash: async (n) => voteTxByNullifier.get(n) ?? null,
  };
}
