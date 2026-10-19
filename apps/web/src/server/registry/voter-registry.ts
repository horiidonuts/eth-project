import "server-only";
import { TREE_DEPTH } from "@/config/election";
import { leafHash } from "@/lib/merkle/hash";
import { buildMerkleTree, type MerkleTree } from "@/lib/merkle/tree";
import syntheticVoters from "../../../data/synthetic-voters.json";

/**
 * The admin's list of eligible voters as a Merkle tree, built in memory from
 * SYNTHETIC data (apps/web/data/synthetic-voters.json).
 * TODO: load leaf hashes from persistent storage instead of raw id numbers.
 */
export interface VoterRegistry {
  readonly voterCount: number;
  readonly tree: MerkleTree;
}

const globalForRegistry = globalThis as typeof globalThis & {
  __evoteRegistry?: Promise<VoterRegistry>;
};

export function getVoterRegistry(): Promise<VoterRegistry> {
  globalForRegistry.__evoteRegistry ??= (async () => {
    const leaves = await Promise.all(
      syntheticVoters.idNumbers.map((id) => leafHash(BigInt(id))),
    );
    return { voterCount: leaves.length, tree: await buildMerkleTree(leaves, TREE_DEPTH) };
  })();
  return globalForRegistry.__evoteRegistry;
}
