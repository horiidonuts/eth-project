"use client";

import { useState } from "react";
import { Mono } from "@/components/mono";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AdminRootResponse } from "@/lib/api-schemas";

export function AdminPanel() {
  // Kept in memory only; re-entered after a reload.
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<AdminRootResponse | null>(null);
  const [pending, setPending] = useState<"load" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "GET" | "POST") {
    setPending(method === "GET" ? "load" : "publish");
    setError(null);
    try {
      setStatus(
        await apiFetch<AdminRootResponse>("/api/admin/merkle-root", {
          method,
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setPending(null);
    }
  }

  const inSync = status !== null && status.registryRoot === status.onChainRoot;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Yönetici anahtarı</CardTitle>
          <CardDescription>
            apps/web/.env.local içindeki ADMIN_TOKEN. Yalnızca bu sayfanın belleğinde tutulur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <Label htmlFor="token">ADMIN_TOKEN</Label>
          <Input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </CardContent>
        <CardFooter className="pt-4">
          <Button variant="outline" disabled={!token || pending !== null} onClick={() => call("GET")}>
            {pending === "load" ? "Yükleniyor…" : "Durumu getir"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>İşlem başarısız</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Seçmen ağacı
              <Badge variant={inSync ? "default" : "secondary"}>
                {inSync ? "Kök yayında" : "Kök yayınlanmadı"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Zincir: {status.chainMode === "mock" ? "sahte (bellek içi)" : "RPC"} · Seçmen
              sayısı: {status.voterCount}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Listeden hesaplanan kök: <Mono value={status.registryRoot} />
            </p>
            <p>
              Sözleşmedeki kök: <Mono value={status.onChainRoot} />
            </p>
            {status.txHash && (
              <p>
                Son işlem: <Mono value={status.txHash} />
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-4">
            <Button disabled={pending !== null || inSync} onClick={() => call("POST")}>
              {pending === "publish" ? "Yayınlanıyor…" : "Ağacı oluştur ve kökü yayınla"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
