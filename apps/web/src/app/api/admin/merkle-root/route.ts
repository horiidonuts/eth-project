import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { AdminRootResponse } from "@/lib/api-schemas";
import { getVotingClient } from "@/server/chain/voting-client";
import { getServerEnv } from "@/server/env";
import { jsonError } from "@/server/http";
import { getVoterRegistry } from "@/server/registry/voter-registry";

/**
 * Admin: inspect (GET) or publish (POST) the voter-tree root.
 * Requires `Authorization: Bearer <ADMIN_TOKEN>`. Placeholder auth for the
 * skeleton; replace with real admin authentication.
 */
export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;
  return NextResponse.json<AdminRootResponse>(await status());
}

export async function POST(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { tree } = await getVoterRegistry();
  const { txHash } = await getVotingClient().setMerkleRoot(tree.root);
  return NextResponse.json<AdminRootResponse>({ ...(await status()), txHash });
}

async function status(): Promise<AdminRootResponse> {
  const client = getVotingClient();
  const [{ voterCount, tree }, onChainRoot] = await Promise.all([
    getVoterRegistry(),
    client.getMerkleRoot(),
  ]);
  return {
    voterCount,
    registryRoot: tree.root.toString(),
    onChainRoot: onChainRoot.toString(),
    chainMode: client.mode,
  };
}

function checkAdmin(request: Request) {
  const expected = getServerEnv().ADMIN_TOKEN;
  if (!expected) {
    return jsonError(503, "ADMIN_DISABLED", "ADMIN_TOKEN ayarlanmamış (.env.local).");
  }
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return jsonError(401, "UNAUTHORIZED", "Geçersiz yönetici anahtarı.");
  }
  return null;
}
