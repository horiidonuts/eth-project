// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVerifier} from "../IVerifier.sol";

/// @notice LOCAL DEVELOPMENT ONLY. Accepts every proof.
/// @dev Lets the voting flow be exercised on a local Hardhat chain before the
///      real Groth16Verifier exists. Never deploy this to a public network.
contract MockVerifier is IVerifier {
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[4] calldata
    ) external pure returns (bool) {
        return true;
    }
}
