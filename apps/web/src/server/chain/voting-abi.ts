import "server-only";

/**
 * Human-readable ABI mirroring packages/contracts/contracts/IVoting.sol.
 * Keep in sync by hand until the ABI is generated from the Hardhat artifacts.
 */
export const VOTING_ABI = [
  "function vote(uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256 root, uint256 nullifierHash, uint256 candidateId)",
  "function isNullifierUsed(uint256 nullifierHash) view returns (bool)",
  "function getResults() view returns (uint256[])",
  "function merkleRoot() view returns (uint256)",
  "function setMerkleRoot(uint256 newRoot)",
  "function candidateCount() view returns (uint256)",
  "function electionId() view returns (uint256)",
  "event VoteCast(uint256 indexed nullifierHash, uint256 indexed candidateId)",
  "event MerkleRootUpdated(uint256 indexed oldRoot, uint256 indexed newRoot)",
  "error NotImplemented()",
] as const;
