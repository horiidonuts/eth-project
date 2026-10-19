#!/usr/bin/env bash
# PLACEHOLDER: compile + trusted setup for circuits/vote.circom.
# Owned by the circuits team; the steps below are the intended outline,
# commented out until the circuit exists. Run from packages/circuits/.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f circuits/vote.circom ]]; then
  echo "circuits/vote.circom does not exist yet; nothing to build." >&2
  exit 1
fi

# 1. Compile          → build/vote.r1cs, build/vote.sym, build/vote_js/vote.wasm
# circom circuits/vote.circom --r1cs --wasm --sym -o build -l node_modules
#
# 2. Phase 1 (download once, NOT committed) → ptau/powersOfTau28_hez_final_XX.ptau
#
# 3. Phase 2 setup    → keys/vote_0000.zkey (intermediate, not committed)
# snarkjs groth16 setup build/vote.r1cs ptau/<file>.ptau keys/vote_0000.zkey
# snarkjs zkey contribute keys/vote_0000.zkey keys/vote_final.zkey --name="team" -v
#
# 4. Exports
# snarkjs zkey export verificationkey keys/vote_final.zkey keys/verification_key.json
# snarkjs zkey export solidityverifier keys/vote_final.zkey build/Groth16Verifier.sol
#
# Then run scripts/copy-artifacts.sh.
echo "build.sh is a placeholder; see comments." >&2
exit 1
