"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mono } from "@/components/mono";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CANDIDATES } from "@/config/election";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { VoteResponse } from "@/lib/api-schemas";
import { ID_NUMBER_PATTERN } from "@/lib/field";
import { useRegistration } from "@/lib/voter-storage";
import { PROOF_ERROR_MESSAGES, PROOF_STAGE_LABELS } from "@/lib/zk/labels";
import { generateVoteProof } from "@/lib/zk/prover";
import { ProofError, type ProofProgress } from "@/lib/zk/types";

type Phase =
  | { kind: "idle" }
  | { kind: "proving"; progress: ProofProgress }
  | { kind: "submitting" }
  | { kind: "done"; receipt: VoteResponse }
  | { kind: "error"; message: string };

export function VoteForm() {
  const registration = useRegistration();
  const [idNumber, setIdNumber] = useState("");
  const [candidateId, setCandidateId] = useState<string>("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  if (registration === undefined) return null; // before hydration

  if (!registration) {
    return (
      <Alert>
        <AlertTitle>Önce kayıt olun</AlertTitle>
        <AlertDescription>
          Oy verebilmek için bu tarayıcıda kayıtlı bir Merkle yolu gerekiyor.{" "}
          <Link href="/register">Kayıt sayfasına gidin.</Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (phase.kind === "done") {
    return <Receipt receipt={phase.receipt} />;
  }

  const busy = phase.kind === "proving" || phase.kind === "submitting";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registration) return;
    if (!ID_NUMBER_PATTERN.test(idNumber)) {
      setPhase({ kind: "error", message: "Kimlik numarası 11 haneli olmalı." });
      return;
    }
    if (candidateId === "") {
      setPhase({ kind: "error", message: "Bir aday seçin." });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "proving", progress: { stage: "loading-artifacts", percent: 0 } });
    try {
      const voteProof = await generateVoteProof(
        {
          idNumber,
          merklePath: registration.merklePath,
          root: registration.root,
          electionId: registration.electionId,
          candidateId: Number(candidateId),
        },
        {
          signal: controller.signal,
          onProgress: (progress) => setPhase({ kind: "proving", progress }),
        },
      );
      setPhase({ kind: "submitting" });
      const receipt = await apiFetch<VoteResponse>("/api/vote", { method: "POST", json: voteProof });
      setIdNumber("");
      setPhase({ kind: "done", receipt });
    } catch (err) {
      const message =
        err instanceof ProofError
          ? PROOF_ERROR_MESSAGES[err.code]
          : err instanceof ApiError
            ? err.message
            : "Beklenmeyen bir hata oluştu.";
      setPhase({ kind: "error", message });
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Oy pusulası</CardTitle>
          <CardDescription>Seçim kimliği: {registration.electionId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="idNumber">Kimlik numarası (sentetik)</Label>
            <Input
              id="idNumber"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="00000000001"
              disabled={busy}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <fieldset className="space-y-3" disabled={busy}>
            <legend className="mb-3 text-sm font-medium">Aday</legend>
            <RadioGroup value={candidateId} onValueChange={(value) => setCandidateId(String(value))}>
              {CANDIDATES.map((c) => (
                <Label
                  key={c.id}
                  htmlFor={`candidate-${c.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary"
                >
                  <RadioGroupItem id={`candidate-${c.id}`} value={String(c.id)} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-muted-foreground">{c.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {phase.kind === "proving" && (
            <div className="space-y-2" aria-live="polite">
              <p className="text-sm">{PROOF_STAGE_LABELS[phase.progress.stage]}</p>
              <Progress value={phase.progress.percent} />
            </div>
          )}
          {phase.kind === "submitting" && (
            <p className="text-sm" aria-live="polite">
              {"Oy relayer'a gönderiliyor…"}
            </p>
          )}
          {phase.kind === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Oy verilemedi</AlertTitle>
              <AlertDescription>{phase.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="gap-2 pt-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Lütfen bekleyin…" : "İspat üret ve oy ver"}
          </Button>
          {phase.kind === "proving" && (
            <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}>
              İptal
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function Receipt({ receipt }: { receipt: VoteResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Oyunuz gönderildi</CardTitle>
        <CardDescription>
          İşlem zincire iletildi. Aşağıdaki bilgilerle oyunuzun durumunu takip edebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          İşlem karması: <Mono value={receipt.txHash} />
        </p>
        <p>
          Nullifier: <Mono value={receipt.nullifierHash} />
        </p>
      </CardContent>
      <CardFooter>
        <Link
          href={`/track?ref=${encodeURIComponent(receipt.txHash)}`}
          className={buttonVariants()}
        >
          Oyumu takip et
        </Link>
      </CardFooter>
    </Card>
  );
}
