import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = { title: "Yönetici" };

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Yönetici paneli"
        description="Seçmen listesinden Merkle ağacını oluşturun ve kökünü sözleşmeye yazın."
      />
      <AdminPanel />
    </>
  );
}
