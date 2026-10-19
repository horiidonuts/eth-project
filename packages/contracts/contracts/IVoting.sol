// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IVoting
/// @notice Public interface of the ZK voting contract.
/// @dev The relayer (apps/web/src/server/chain/voting-abi.ts) mirrors these
///      signatures; keep both in sync when changing anything here.
///
///      Public signal order expected from the circuit (snarkjs puts outputs
///      first, then public inputs in declaration order):
///        [0] nullifierHash  (output)
///        [1] root           (public input)
///        [2] electionId     (public input)
///        [3] candidateId    (public input)
///      See packages/circuits/README.md, "Devre arayüz sözleşmesi".
interface IVoting {
    /// @notice Emitted once per accepted vote.
    event VoteCast(uint256 indexed nullifierHash, uint256 indexed candidateId);

    /// @notice Emitted when the admin publishes a new voter-tree root.
    event MerkleRootUpdated(uint256 indexed oldRoot, uint256 indexed newRoot);

    /// @notice Casts an anonymous vote.
    /// @dev Must revert if: the proof is invalid, `root` differs from
    ///      `merkleRoot()`, `nullifierHash` was already used, or
    ///      `candidateId >= candidateCount()`. `electionId` is not passed in;
    ///      the contract supplies its own value when building the public signals.
    /// @param pA Groth16 proof point A.
    /// @param pB Groth16 proof point B (coordinates already in Solidity order).
    /// @param pC Groth16 proof point C.
    /// @param root Merkle root the proof was generated against.
    /// @param nullifierHash Per-voter, per-election unique value; blocks double votes.
    /// @param candidateId Index of the chosen candidate (0-based).
    function vote(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256 root,
        uint256 nullifierHash,
        uint256 candidateId
    ) external;

    /// @notice Whether a nullifier has already been used to vote.
    function isNullifierUsed(uint256 nullifierHash) external view returns (bool);

    /// @notice Vote counts indexed by candidate id.
    function getResults() external view returns (uint256[] memory);

    /// @notice Root of the eligible-voter Merkle tree.
    function merkleRoot() external view returns (uint256);

    /// @notice Publishes the eligible-voter tree root. Admin only.
    function setMerkleRoot(uint256 newRoot) external;

    /// @notice Number of candidates in this election.
    function candidateCount() external view returns (uint256);

    /// @notice Identifier of this election; bound into every nullifier.
    function electionId() external view returns (uint256);
}
