import { z } from "zod";
import { TREE_DEPTH } from "@/config/election";
import { ID_NUMBER_PATTERN, isFieldString } from "@/lib/field";
import { PUBLIC_SIGNAL_ORDER } from "@/lib/zk/public-signals";

/** Request/response shapes shared by the API routes and the pages. */

export const fieldString = z.string().refine(isFieldString, "Geçerli bir alan elemanı değil");

export const idNumberSchema = z.string().regex(ID_NUMBER_PATTERN, "11 haneli olmalı");

export const merklePathSchema = z.object({
  pathElements: z.array(fieldString).length(TREE_DEPTH),
  pathIndices: z.array(z.union([z.literal(0), z.literal(1)])).length(TREE_DEPTH),
});

export const groth16ProofSchema = z.object({
  pi_a: z.array(fieldString).length(3),
  pi_b: z.array(z.array(fieldString).length(2)).length(3),
  pi_c: z.array(fieldString).length(3),
  protocol: z.literal("groth16"),
  curve: z.literal("bn128"),
});

// POST /api/vote
export const voteRequestSchema = z.object({
  proof: groth16ProofSchema,
  publicSignals: z.array(fieldString).length(PUBLIC_SIGNAL_ORDER.length),
});
export type VoteRequest = z.infer<typeof voteRequestSchema>;
export interface VoteResponse {
  status: "submitted";
  txHash: string;
  nullifierHash: string;
}

// POST /api/merkle-proof
export const merkleProofRequestSchema = z.object({ leaf: fieldString });
export interface MerkleProofResponse {
  leafIndex: number;
  merklePath: z.infer<typeof merklePathSchema>;
  root: string;
}

// GET /api/track?ref=
export type TxStatus = "pending" | "confirmed" | "failed";
export type TrackResponse =
  | { found: true; txHash: string; status: TxStatus; blockNumber: number | null }
  | { found: false };

// GET|POST /api/admin/merkle-root
export interface AdminRootResponse {
  voterCount: number;
  registryRoot: string;
  onChainRoot: string;
  chainMode: "mock" | "rpc";
  txHash?: string;
}

/** Every non-2xx response has this shape. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}
