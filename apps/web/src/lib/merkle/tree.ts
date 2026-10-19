import { nodeHash } from "@/lib/merkle/hash";

/**
 * Fixed-depth binary Merkle tree. Empty slots are filled with ZERO_VALUE and
 * its hashed "zero subtrees".
 * Path convention (circomlib MerkleTreeChecker style): pathIndices[i] = 0 means
 * the current node is the LEFT child at level i, 1 means it is the RIGHT child.
 */
export interface MerklePath {
  /** Sibling at each level, leaf level first (decimal strings). */
  pathElements: string[];
  pathIndices: (0 | 1)[];
}

export interface MerkleTree {
  readonly depth: number;
  readonly root: bigint;
  readonly leaves: readonly bigint[];
  indexOf(leaf: bigint): number;
  getPath(index: number): MerklePath;
}

export const ZERO_VALUE = 0n;

export async function buildMerkleTree(
  leaves: readonly bigint[],
  depth: number,
): Promise<MerkleTree> {
  if (leaves.length > 2 ** depth) {
    throw new Error(`Tree of depth ${depth} cannot hold ${leaves.length} leaves`);
  }

  const zeros: bigint[] = [ZERO_VALUE];
  for (let level = 0; level < depth; level++) {
    zeros.push(await nodeHash(zeros[level], zeros[level]));
  }

  const layers: bigint[][] = [[...leaves]];
  for (let level = 0; level < depth; level++) {
    const current = layers[level];
    const next: bigint[] = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(await nodeHash(current[i], current[i + 1] ?? zeros[level]));
    }
    layers.push(next);
  }
  const root = layers[depth][0] ?? zeros[depth];

  return {
    depth,
    root,
    leaves: layers[0],
    indexOf: (leaf) => layers[0].indexOf(leaf),
    getPath(index) {
      if (index < 0 || index >= layers[0].length) {
        throw new RangeError(`Leaf index ${index} out of range`);
      }
      const pathElements: string[] = [];
      const pathIndices: (0 | 1)[] = [];
      let idx = index;
      for (let level = 0; level < depth; level++) {
        const sibling = layers[level][idx ^ 1] ?? zeros[level];
        pathElements.push(sibling.toString());
        pathIndices.push((idx & 1) as 0 | 1);
        idx >>= 1;
      }
      return { pathElements, pathIndices };
    },
  };
}

/** Recomputes the root from a leaf and its path (what the circuit enforces). */
export async function computeRoot(leaf: bigint, path: MerklePath): Promise<bigint> {
  let node = leaf;
  for (let i = 0; i < path.pathElements.length; i++) {
    const sibling = BigInt(path.pathElements[i]);
    node = path.pathIndices[i] === 0 ? await nodeHash(node, sibling) : await nodeHash(sibling, node);
  }
  return node;
}
