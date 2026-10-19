import "server-only";
import { Contract, JsonRpcProvider, NonceManager, Wallet, isCallException } from "ethers";
import type { RpcEnv } from "@/server/env";
import { VOTING_ABI } from "@/server/chain/voting-abi";
import { ContractRevertError, type VotingClient } from "@/server/chain/voting-client";

/**
 * Talks to the deployed Voting contract. The relayer wallet signs and pays
 * gas for every vote, so voters need no wallet.
 */
export function createEthersVotingClient(env: RpcEnv): VotingClient {
  const provider = new JsonRpcProvider(env.ALCHEMY_RPC_URL, env.CHAIN_ID, { staticNetwork: true });
  // NonceManager keeps concurrent votes from reusing a nonce. If a send fails
  // after the nonce was taken, call signer.reset().
  const signer = new NonceManager(new Wallet(env.RELAYER_PRIVATE_KEY, provider));
  const contract = new Contract(env.CONTRACT_ADDRESS, VOTING_ABI, signer);

  /** Simulates first so a reverting tx never costs the relayer gas. */
  async function send(method: string, args: unknown[]): Promise<{ txHash: string }> {
    const fn = contract.getFunction(method);
    try {
      await fn.staticCall(...args);
    } catch (err) {
      if (isCallException(err)) {
        throw new ContractRevertError(err.revert?.name ?? err.reason ?? "unknown");
      }
      throw err;
    }
    const tx = await fn.send(...args);
    return { txHash: tx.hash };
  }

  return {
    mode: "rpc",
    getMerkleRoot: async () => (await contract.getFunction("merkleRoot")()) as bigint,
    getElectionId: async () => (await contract.getFunction("electionId")()) as bigint,
    getCandidateCount: async () => Number(await contract.getFunction("candidateCount")()),
    getResults: async () => [...((await contract.getFunction("getResults")()) as bigint[])],
    isNullifierUsed: async (n) => (await contract.getFunction("isNullifierUsed")(n)) as boolean,

    submitVote: ({ proof, root, nullifierHash, candidateId }) =>
      send("vote", [proof.pA, proof.pB, proof.pC, root, nullifierHash, candidateId]),

    setMerkleRoot: (root) => send("setMerkleRoot", [root]),

    async getTxStatus(txHash) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        return {
          txHash,
          status: receipt.status === 1 ? "confirmed" : "failed",
          blockNumber: receipt.blockNumber,
        };
      }
      const tx = await provider.getTransaction(txHash);
      return tx ? { txHash, status: "pending", blockNumber: null } : null;
    },

    async findVoteTxHash(nullifierHash) {
      // Free RPC tiers cap eth_getLogs ranges; CONTRACT_DEPLOY_BLOCK keeps it small.
      const events = await contract.queryFilter(
        contract.filters.VoteCast(nullifierHash),
        env.CONTRACT_DEPLOY_BLOCK,
      );
      return events[0]?.transactionHash ?? null;
    },
  };
}
