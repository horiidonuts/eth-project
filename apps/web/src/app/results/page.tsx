import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CANDIDATES } from "@/config/election";
import { getVotingClient } from "@/server/chain/voting-client";
import { RefreshButton } from "./refresh-button";

export const metadata: Metadata = { title: "Sonuçlar" };

export default function ResultsPage() {
  return (
    <>
      <PageHeader
        title="Sonuçlar"
        description="Sayım doğrudan akıllı sözleşmeden okunur; herkes aynı sonucu doğrulayabilir."
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Sonuçlar yükleniyor…</p>}>
        <ResultsTable />
      </Suspense>
    </>
  );
}

async function ResultsTable() {
  await connection(); // always read the current tally, never a prerendered one
  const client = getVotingClient();
  const tallies = await client.getResults();
  const total = tallies.reduce((sum, n) => sum + n, 0n);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Toplam {total.toString()} oy</CardTitle>
        <RefreshButton />
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {CANDIDATES.map((candidate) => {
            const votes = tallies[candidate.id] ?? 0n;
            const percent = total === 0n ? 0 : Number((votes * 1000n) / total) / 10;
            return (
              <li key={candidate.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{candidate.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {votes.toString()} oy · %{percent.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          Kaynak: {client.mode === "mock" ? "sahte (bellek içi) zincir" : "Voting sözleşmesi"}
        </p>
      </CardContent>
    </Card>
  );
}
