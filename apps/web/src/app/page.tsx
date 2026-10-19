import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    title: "1. Kayıt",
    text: "Kimlik numaranızın karması tarayıcıda hesaplanır; sunucu size seçmen ağacındaki yolunuzu verir.",
  },
  {
    title: "2. İspat",
    text: "Oy verirken tarayıcınız bir sıfır bilgi ispatı üretir: listede olduğunuzu kanıtlar, kim olduğunuzu açıklamaz.",
  },
  {
    title: "3. Relayer",
    text: "İspat ve oy sunucuya gider. Sunucu işlemi kendi cüzdanıyla imzalar ve gas ücretini öder; cüzdana ihtiyacınız yok.",
  },
  {
    title: "4. Sayım",
    text: "Akıllı sözleşme ispatı doğrular, nullifier ile çift oyu engeller ve oyu sayar. Sonuçlar herkese açıktır.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Gizli ve doğrulanabilir oylama</h1>
        <p className="text-muted-foreground">
          Seçmen listesinde olduğunuzu kimliğinizi açıklamadan kanıtlayın. Her seçmen yalnızca bir
          kez oy verebilir ve herkes sonucu zincir üzerinde doğrulayabilir.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Kayıt ol
          </Link>
          <Link href="/vote" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Oy ver
          </Link>
          <Link href="/results" className={buttonVariants({ size: "lg", variant: "ghost" })}>
            Sonuçlar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="text-sm text-muted-foreground">
          Bu bir geliştirme sürümüdür. Test için <strong>sentetik</strong> kimlik numaralarını
          kullanın: <code className="font-mono">00000000001</code> –{" "}
          <code className="font-mono">00000000016</code>.
        </CardContent>
      </Card>
    </div>
  );
}
