"use client";

import { useState } from "react";
import Link from "next/link";
import { Mono } from "@/components/mono";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ELECTION_ID } from "@/config/election";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { MerkleProofResponse } from "@/lib/api-schemas";
import { ID_NUMBER_PATTERN } from "@/lib/field";
import { leafHash } from "@/lib/merkle/hash";
import {
  clearRegistration,
  saveRegistration,
  useRegistration,
  type StoredRegistration,
} from "@/lib/voter-storage";

export function RegisterForm() {
  const [idNumber, setIdNumber] = useState("");
  const registration = useRegistration();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!ID_NUMBER_PATTERN.test(idNumber)) {
      setError("Kimlik numarası 11 haneli olmalı.");
      return;
    }
    setPending(true);
    try {
      // Only the hash leaves the browser, never the id number itself.
      const leaf = (await leafHash(BigInt(idNumber))).toString();
      const res = await apiFetch<MerkleProofResponse>("/api/merkle-proof", {
        method: "POST",
        json: { leaf },
      });
      const stored: StoredRegistration = {
        leaf,
        leafIndex: res.leafIndex,
        merklePath: res.merklePath,
        root: res.root,
        electionId: ELECTION_ID,
        savedAt: new Date().toISOString(),
      };
      if (saveRegistration(stored)) {
        setIdNumber("");
      } else {
        setError("Kayıt tarayıcıya kaydedilemedi (gizli pencere / depolama kapalı olabilir).");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  if (registration === undefined) return null; // before hydration

  if (registration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kayıtlısınız</CardTitle>
          <CardDescription>
            Merkle yolunuz bu tarayıcıda saklandı. Kimlik numaranız saklanmadı; oy verirken
            yeniden girmeniz gerekecek.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Ağaçtaki sıra: <Mono value={String(registration.leafIndex)} />
          </p>
          <p>
            Ağaç kökü: <Mono value={registration.root} />
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Link href="/vote" className={buttonVariants()}>
            Oy vermeye geç
          </Link>
          <Button
            variant="outline"
            onClick={clearRegistration}
          >
            Kaydı sil
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Kimlik numarası</CardTitle>
          <CardDescription>
            Test için sentetik numaraları kullanın: 00000000001 – 00000000016. Gerçek kimlik
            numarası girmeyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="idNumber">Kimlik numarası</Label>
            <Input
              id="idNumber"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="00000000001"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Kayıt başarısız</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Kontrol ediliyor…" : "Kayıt ol"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
