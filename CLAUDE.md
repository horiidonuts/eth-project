# CLAUDE.md

Bağlam notları: sonraki oturumlar için. Genel bakış ve kurulum için `README.md` dosyasına bakın.

## Proje ve sorumluluklar

ZK e-oylama bitirme projesi, 3 kişilik ekip. pnpm monoreposu.
- **Kullanıcı (bu oturumların sahibi):** tam yığın; ağırlıklı olarak `apps/web` (ön uç + relayer API).
- **Ekip arkadaşları:** `packages/contracts` (Solidity) ve `packages/circuits` (Circom).
  Bu iki pakette iş mantığı yazma; arayüz/iskelet değişikliği gerekiyorsa öner ve sor.

## Komutlar

```bash
pnpm dev            # apps/web, http://localhost:3000
pnpm build          # next build + hardhat build (her ana adımdan sonra çalıştır)
pnpm lint           # eslint (apps/web)
pnpm test           # hardhat test (packages/contracts)
pnpm chain          # yerel Hardhat ağı
pnpm deploy:local   # Voting + MockVerifier → localhost
pnpm --filter @evote/web <script>   # tek pakette çalıştırma
```

## Mimari (apps/web)

- `src/lib/` hem tarayıcıda hem sunucuda çalışır; `src/server/` yalnızca sunucuda çalışır
  (her dosyada `import "server-only"`).
- **İspat:** `generateVoteProof()` (`src/lib/zk/prover.ts`) her ispat için ayrı bir Web Worker
  (`proof.worker.ts`) açar; worker aktif backend'i çağırır. İlerleme bilgisi `postMessage` ile gelir.
  İptal `AbortSignal` ile yapılır ve worker'ı sonlandırır.
- **Genel sinyal sırası** tek yerde tanımlı: `src/lib/zk/public-signals.ts` →
  `[nullifierHash, root, electionId, candidateId]`.
- **Relayer:** `src/app/api/vote/route.ts` ince bir katmandır; asıl mantık
  `src/server/relayer/relay-vote.ts` içindedir. Sıra şöyle: zod şeması → zincir dışı doğrulama →
  seçim/kök/aday kontrolleri → nullifier kontrolü (+ bellekteki `claimed` kümesi) →
  `staticCall` ile simülasyon → gönderim. Ucuz kontroller gas harcamadan önce yapılır.
- **Zincir:** `VotingClient` arayüzü (`src/server/chain/voting-client.ts`). `CHAIN_MODE=mock` bellekte
  çalışır (globalThis'te tek örnek; sunucu yeniden başlayınca sıfırlanır), `rpc` ethers v6 kullanır
  (`NonceManager` + `Wallet` + `JsonRpcProvider`).
- **ABI:** `src/server/chain/voting-abi.ts`, `packages/contracts/contracts/IVoting.sol` ile **elle**
  senkron tutulur. IVoting değişirse burayı da güncelle.
- **Seçmen kaydı:** `src/server/registry/voter-registry.ts`, sentetik JSON'dan bellekte ağaç kurar.
- Ortam değişkenleri `src/server/env.ts` içinde zod ile ve ilk kullanımda doğrulanır (build
  sırasında .env gerekmez). Hata mesajları yalnızca değişken adlarını içerir, değerleri değil.

## Geçiş noktaları (mock → gerçek)

1. `src/lib/zk/backend/index.ts`: prover (tek satır, `snarkjsBackend`)
2. `src/lib/merkle/hash.ts`: `fieldHash` (SHA-256 mock → Poseidon; devreyle aynı olmalı)
3. `src/server/zk/verifier.ts`: relayer doğrulayıcısı (tek satır, `snarkjsVerifier`)
4. `.env.local` içinde `CHAIN_MODE=rpc`

Mock prover ve mock doğrulayıcı, `pi_c[0] = H(publicSignals)` etiketiyle çalışır
(`src/lib/zk/mock-proof.ts`). Böylece kurcalanmış sinyaller mock modda da reddedilir.

## Devre arayüz sözleşmesi

`packages/circuits/README.md` dosyasında. Özel girdiler `idNumber`, `pathElements[20]`, `pathIndices[20]`;
genel girdiler `root`, `electionId`, `candidateId`; çıktı `nullifierHash`. Değişirse şunlar birlikte
güncellenmeli: `public-signals.ts`, `backend/snarkjs.ts` (`toCircuitInput`), `IVerifier.sol`
(`uint[4]`), `IVoting.sol` yorumları, `TREE_DEPTH` (`src/config/election.ts`).
Ağaç yolu kuralı: `pathIndices[i] = 1` → düğüm sağ çocuktur.

## Kurallar

- **Gerçek kimlik numarası kullanma.** Tüm test verisi sentetik olmalı; sentetik kimlikler `0` ile başlar.
- **Gerçek anahtarlar asla repoya girmez.** `.env*` yok sayılır (`.env.example` hariç). Sözleşme
  anahtarları Hardhat keystore'da tutulur. Sunucu sırları `NEXT_PUBLIC_` önekiyle tanımlanmaz.
- Kod, tanımlayıcılar ve yorumlar İngilizce; arayüz metinleri ve kullanıcıya dönen API hata
  mesajları Türkçe; URL'ler İngilizce (`/register`, `/vote`, `/track`, `/results`, `/admin`).
- Belirsiz tasarım kararlarında (kütüphane seçimi vb.) seçenekleri kısaca sun, kullanıcı seçsin.
  Emin olmadığın bir API'yi uydurma; belgelere bak ya da sor.
- Her ana adımdan sonra `pnpm build` çalıştır; `pnpm dev`'i arka planda başlatıp sayfaları kontrol et.
- Seçilen kütüphaneler: UI için shadcn/ui (`src/components/ui/`), durum yönetimi kütüphanesi yok
  (React state). Yeni bir kütüphane eklemeden önce sor.

## Sürüm notları (2026-10)

- **TypeScript 6.0.x sabit.** TS 7, `typescript-eslint` tarafından desteklenmiyor (`<6.1.0`) ve
  Next.js'in TS 7 denetleyicisi deneysel. Bu ikisi değişmeden yükseltme.
- **ESLint 9.** `eslint-plugin-react`, `-import` ve `-jsx-a11y` henüz ESLint 10'u desteklemiyor.
- **Next.js 16.4:** `cacheComponents` açık; istek anındaki verileri (`connection()`, mock zincir
  okumaları) `<Suspense>` içinde kullan. Next API'leri değişmiş olabilir; yazmadan önce
  `apps/web/node_modules/next/dist/docs/` belgelerini oku (bkz. `apps/web/AGENTS.md`).
- **Hardhat 3:** ESM (`"type": "module"`), `defineConfig`, `plugins: [...]`, testlerde
  `await network.create()` (`connect()` kullanımdan kalktı).

## Açık konular (ekiple konuşulacak)

- **Gizlilik:** Kimlik listesine sahip olan nullifier'ı hesaplayıp oyu kimliğe bağlayabilir
  (README → Bilinen sınırlamalar). Ekip bu modeli bilerek seçti.
- `setMerkleRoot` yetkisi: taslakta admin = dağıtıcı adres, oysa `/api/admin/merkle-root` relayer
  cüzdanıyla imzalıyor. Ya aynı hesap kullanılmalı ya da sözleşmede admin ayarlanabilir olmalı.
- Kök, oylama başladıktan sonra değişebilir mi? (Relayer eski köke ait ispatı `STALE_ROOT` ile reddeder.)
- snarkjs'nin Turbopack worker içinde paketlenmesi henüz denenmedi. Devre çıktıları gelince doğrula.
- Arayüz akışı (kayıt → oy → takip) gerçek tarayıcıda henüz elle denenmedi; API akışı betikle doğrulandı.
