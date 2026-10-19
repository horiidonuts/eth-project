import "server-only";
import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/lib/api-schemas";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}

/** Parses a JSON body, returning null on malformed input. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
