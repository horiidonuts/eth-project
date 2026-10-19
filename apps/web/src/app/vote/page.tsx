import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { VoteForm } from "./vote-form";

export const metadata: Metadata = { title: "Oy ver" };

export default function VotePage() {
  return (
    <>
      <PageHeader
        title="Oy ver"
        description="İspat tarayıcınızda üretilir; kimlik numaranız cihazınızdan çıkmaz."
      />
      <VoteForm />
    </>
  );
}
