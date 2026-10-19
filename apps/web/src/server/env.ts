import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated on first use (not at import time, so
 * `next build` works without a .env file). Never expose these to the client:
 * none of them has the NEXT_PUBLIC_ prefix, and this module is server-only.
 */

// `KEY=` in a .env file yields "", which should behave like "unset".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const baseSchema = z.object({
  CHAIN_MODE: z.enum(["mock", "rpc"]).default("mock"),
  ADMIN_TOKEN: optional(z.string().min(16, "en az 16 karakter olmalı")),
});

const rpcSchema = z.object({
  ALCHEMY_RPC_URL: z.url(),
  CHAIN_ID: z.coerce.number().int().positive(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "0x ile başlayan 20 baytlık adres"),
  RELAYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "0x ile başlayan 32 baytlık anahtar"),
  CONTRACT_DEPLOY_BLOCK: z.coerce.number().int().nonnegative().default(0),
});

export type BaseEnv = z.infer<typeof baseSchema>;
export type RpcEnv = z.infer<typeof rpcSchema>;
export type ServerEnv =
  | (BaseEnv & { CHAIN_MODE: "mock" })
  | (BaseEnv & { CHAIN_MODE: "rpc"; rpc: RpcEnv });

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const base = parse(baseSchema);
  cached =
    base.CHAIN_MODE === "rpc"
      ? { ...base, CHAIN_MODE: "rpc", rpc: parse(rpcSchema) }
      : { ...base, CHAIN_MODE: "mock" };
  return cached;
}

function parse<T extends z.ZodType>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Report variable names and reasons only — never the values (secrets).
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment (${problems}). See apps/web/.env.example`);
  }
  return result.data;
}
