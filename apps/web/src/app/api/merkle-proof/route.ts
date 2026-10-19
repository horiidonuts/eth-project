import { NextResponse } from "next/server";
import { merkleProofRequestSchema, type MerkleProofResponse } from "@/lib/api-schemas";
import { jsonError, readJson } from "@/server/http";
import { getVoterRegistry } from "@/server/registry/voter-registry";

/**
 * Registration: returns the Merkle path for a leaf H(idNumber).
 * POST rather than GET so the leaf does not end up in URLs or access logs.
 */
export async function POST(request: Request) {
  const parsed = merkleProofRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "INVALID_REQUEST", "İstek gövdesi geçersiz.");
  }

  const { tree } = await getVoterRegistry();
  const leafIndex = tree.indexOf(BigInt(parsed.data.leaf));
  if (leafIndex === -1) {
    return jsonError(404, "NOT_ELIGIBLE", "Bu kimlik numarası seçmen listesinde yok.");
  }

  return NextResponse.json<MerkleProofResponse>({
    leafIndex,
    merklePath: tree.getPath(leafIndex),
    root: tree.root.toString(),
  });
}
