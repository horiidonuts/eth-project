// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoting} from "./IVoting.sol";
import {IVerifier} from "./IVerifier.sol";

/// @title Voting
/// @notice DRAFT. Storage layout and signatures only; the business logic is
///         to be written by the contracts owner (see CLAUDE.md).
contract Voting is IVoting {
    error NotImplemented();

    /// @notice Groth16 verifier for the vote circuit.
    IVerifier public immutable verifier;

    /// @notice Account allowed to publish the Merkle root.
    address public immutable admin;

    /// @inheritdoc IVoting
    uint256 public immutable electionId;

    /// @inheritdoc IVoting
    uint256 public immutable candidateCount;

    /// @inheritdoc IVoting
    uint256 public merkleRoot;

    mapping(uint256 nullifierHash => bool used) private _nullifierUsed;
    uint256[] private _tallies;

    constructor(IVerifier verifier_, uint256 electionId_, uint256 candidateCount_) {
        verifier = verifier_;
        admin = msg.sender;
        electionId = electionId_;
        candidateCount = candidateCount_;
        _tallies = new uint256[](candidateCount_);
    }

    /// @inheritdoc IVoting
    function vote(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256,
        uint256,
        uint256
    ) external pure {
        // TODO(contracts):
        //  1. require root == merkleRoot
        //  2. require !_nullifierUsed[nullifierHash]
        //  3. require candidateId < candidateCount
        //  4. require verifier.verifyProof(pA, pB, pC,
        //         [nullifierHash, root, electionId, candidateId])
        //  5. _nullifierUsed[nullifierHash] = true; _tallies[candidateId]++;
        //  6. emit VoteCast(nullifierHash, candidateId)
        //  Remove `pure` once implemented.
        revert NotImplemented();
    }

    /// @inheritdoc IVoting
    function isNullifierUsed(uint256 nullifierHash) external view returns (bool) {
        return _nullifierUsed[nullifierHash];
    }

    /// @inheritdoc IVoting
    function getResults() external view returns (uint256[] memory) {
        return _tallies;
    }

    /// @inheritdoc IVoting
    function setMerkleRoot(uint256) external pure {
        // TODO(contracts): onlyAdmin, then update merkleRoot and emit
        //  MerkleRootUpdated. Decide whether the root may change after voting starts.
        //  Remove `pure` once implemented.
        revert NotImplemented();
    }
}
