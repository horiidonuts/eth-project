import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Kayıt" };

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Kayıt"
        description="Seçmen listesinde olduğunuzu doğrulayın ve oy verirken gereken Merkle yolunuzu alın."
      />
      <RegisterForm />
    </>
  );
}
