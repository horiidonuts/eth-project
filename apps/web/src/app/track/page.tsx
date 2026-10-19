import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Oy takibi" };

export default function TrackPage() {
  return (
    <>
      <PageHeader
        title="Oy takibi"
        description="Oy verdikten sonra aldığınız işlem karması ya da nullifier ile oyunuzun zincire yazılıp yazılmadığını kontrol edin."
      />
      {/* useSearchParams() needs a Suspense boundary with Cache Components. */}
      <Suspense>
        <TrackForm />
      </Suspense>
    </>
  );
}
