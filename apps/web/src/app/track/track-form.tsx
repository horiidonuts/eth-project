"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mono } from "@/components/mono";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { TrackResponse, TxStatus } from "@/lib/api-schemas";

const POLL_MS = 2000;

const STATUS_LABEL: Record<TxStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  failed: "Başarısız",
};

export function TrackForm() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useSearchParams().get("ref") ?? "";
  const [input, setInput] = useState(ref);
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (value: string) => {
    try {
      const res = await apiFetch<TrackResponse>(`/api/track?ref=${encodeURIComponent(value)}`);
      setResult(res);
      setError(null);
      return res;
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.");
      return null;
    }
  }, []);

  // Look up whatever is in the URL, and keep polling while the tx is pending.
  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      const res = await lookup(ref);
      if (!cancelled && res?.found && res.status === "pending") {
        timer = setTimeout(tick, POLL_MS);
      }
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref, lookup]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (value) router.replace(`${pathname}?ref=${encodeURIComponent(value)}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-2">
            <Label htmlFor="ref">İşlem karması veya nullifier</Label>
            <Input
              id="ref"
              autoComplete="off"
              placeholder="0x… ya da ondalık nullifier"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
          <CardFooter className="pt-4">
            <Button type="submit">Sorgula</Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Sorgulanamadı</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !result.found && (
        <Alert>
          <AlertTitle>Bulunamadı</AlertTitle>
          <AlertDescription>Bu karma veya nullifier ile kayıtlı bir oy işlemi yok.</AlertDescription>
        </Alert>
      )}

      {result?.found && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              İşlem durumu
              <Badge variant={result.status === "failed" ? "destructive" : result.status === "confirmed" ? "default" : "secondary"}>
                {STATUS_LABEL[result.status]}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              İşlem karması: <Mono value={result.txHash} />
            </p>
            <p>Blok: {result.blockNumber ?? "henüz yok"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
