import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Synthetic defaults; must match apps/web/src/config/election.ts.
const DEFAULT_ELECTION_ID = 1n;
const DEFAULT_CANDIDATE_COUNT = 3n;

/**
 * Deploys Voting. Until the real Groth16Verifier exists, a MockVerifier is
 * deployed alongside it, which is acceptable ONLY on a local chain.
 * TODO(contracts): swap MockVerifier for Groth16Verifier before Sepolia.
 */
export default buildModule("VotingModule", (m) => {
  const electionId = m.getParameter("electionId", DEFAULT_ELECTION_ID);
  const candidateCount = m.getParameter("candidateCount", DEFAULT_CANDIDATE_COUNT);

  const verifier = m.contract("MockVerifier");
  const voting = m.contract("Voting", [verifier, electionId, candidateCount]);

  return { verifier, voting };
});
