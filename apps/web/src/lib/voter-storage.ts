import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { fieldString, merklePathSchema } from "@/lib/api-schemas";

/**
 * Browser-side storage of the registration result (the voter's Merkle path).
 * The id number itself is deliberately NOT stored; it is re-entered when voting.
 */
const STORAGE_KEY = "evote.registration.v1";
const CHANGE_EVENT = "evote:registration-change";

const registrationSchema = z.object({
  leaf: fieldString,
  leafIndex: z.number().int().nonnegative(),
  merklePath: merklePathSchema,
  root: fieldString,
  electionId: z.string(),
  savedAt: z.string(),
});
export type StoredRegistration = z.infer<typeof registrationSchema>;

/** Returns false if the browser refused to store it (private mode, storage disabled). */
export function saveRegistration(registration: StoredRegistration): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registration));
    return true;
  } catch {
    return false;
  } finally {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function clearRegistration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function parse(raw: string | null): StoredRegistration | null {
  if (!raw) return null;
  try {
    const parsed = registrationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * The stored registration, kept in sync with localStorage.
 * `undefined` while rendering on the server / before hydration.
 */
export function useRegistration(): StoredRegistration | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw]);
}
