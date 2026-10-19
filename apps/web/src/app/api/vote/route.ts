import { NextResponse } from "next/server";
import { voteRequestSchema, type VoteResponse } from "@/lib/api-schemas";
import { jsonError, readJson } from "@/server/http";
import { relayVote } from "@/server/relayer/relay-vote";

/**
 * Relayer endpoint. Receives { proof, publicSignals } from the browser,
 * checks it, and submits the vote with the relayer's wallet.
 *   202 submitted · 400 malformed · 409 already voted / root not set
 *   422 invalid proof or signals · 502 chain error
 */
export async function POST(request: Request) {
  const parsed = voteRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "INVALID_REQUEST", "İstek gövdesi geçersiz.");
  }

  const result = await relayVote(parsed.data);
  if (!result.ok) {
    return jsonError(result.status, result.code, result.message);
  }
  return NextResponse.json<VoteResponse>(
    { status: "submitted", txHash: result.txHash, nullifierHash: result.nullifierHash },
    { status: 202 },
  );
}
