import { NextResponse, type NextRequest } from "next/server";
import type { TrackResponse } from "@/lib/api-schemas";
import { isFieldString } from "@/lib/field";
import { getVotingClient } from "@/server/chain/voting-client";
import { jsonError } from "@/server/http";

const TX_HASH = /^0x[0-9a-fA-F]{64}$/;

/** Vote tracking: GET /api/track?ref=<txHash | nullifierHash> */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref")?.trim() ?? "";
  const client = getVotingClient();

  let txHash: string | null;
  if (TX_HASH.test(ref)) {
    txHash = ref.toLowerCase();
  } else if (isFieldString(ref)) {
    txHash = await client.findVoteTxHash(BigInt(ref));
  } else {
    return jsonError(400, "INVALID_REF", "İşlem karması (0x…) ya da nullifier girin.");
  }

  const tx = txHash ? await client.getTxStatus(txHash) : null;
  return NextResponse.json<TrackResponse>(
    tx ? { found: true, ...tx } : { found: false },
  );
}
