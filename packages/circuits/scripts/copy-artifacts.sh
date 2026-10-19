#!/usr/bin/env bash
# Copies the final circuit artifacts to where the other packages expect them.
# The destinations are the contract between packages; do not change them
# without updating apps/web and packages/contracts (see README.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CIRCUITS="$ROOT/packages/circuits"

copy() { # src dst
  if [[ ! -f "$1" ]]; then echo "missing: $1" >&2; exit 1; fi
  mkdir -p "$(dirname "$2")"
  cp "$1" "$2"
  echo "copied ${1#"$ROOT/"} -> ${2#"$ROOT/"}"
}

# Browser prover (fetched at runtime by apps/web/src/lib/zk/backend/snarkjs.ts)
copy "$CIRCUITS/build/vote_js/vote.wasm"         "$ROOT/apps/web/public/zk/vote.wasm"
copy "$CIRCUITS/keys/vote_final.zkey"            "$ROOT/apps/web/public/zk/vote_final.zkey"
# Relayer's off-chain verification (apps/web/src/server/zk/verifier.ts)
copy "$CIRCUITS/keys/verification_key.json"      "$ROOT/apps/web/src/server/zk/verification_key.json"
# On-chain verifier
copy "$CIRCUITS/build/Groth16Verifier.sol"       "$ROOT/packages/contracts/contracts/Groth16Verifier.sol"
