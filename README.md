# ZK E-Oylama

Blokzincir tabanlı, sıfır bilgi ispatlı (ZK) elektronik oylama sistemi — bitirme projesi.
Seçmen, kim olduğunu açıklamadan seçmen listesinde olduğunu ispatlar; çift oy bir
**nullifier** ile engellenir; oylar ve sonuçlar zincirde herkese açıktır.

> **Durum:** İskelet. İspat üretimi, ispat doğrulama, karma fonksiyonu ve zincir
> bağlantısı şimdilik **mock** (sahte) uygulamalarla çalışıyor; her biri tek bir
> dosyadan gerçeğine çevrilir (aşağıda "Geçiş noktaları"). Tüm test verileri sentetiktir.

## Nasıl çalışır

```
 Yönetici                Tarayıcı (seçmen)                 Relayer (Next.js API)        Sözleşme (Voting.sol)
    │  kimlik karmaları → Merkle ağacı                              │                            │
    │──────────────────────────────── kök ─────────────────────────────────────────────────────▶│ setMerkleRoot
    │                         │ 1. kayıt: H(kimlik) ──────────────▶ │ /api/merkle-proof          │
    │                         │ ◀──────────── Merkle yolu ──────────│                            │
    │                         │ 2. Web Worker'da ZK ispatı          │                            │
    │                         │    (kimlik gizli; nullifier çıkar)  │                            │
    │                         │ 3. ispat + oy ────────────────────▶ │ /api/vote                  │
    │                         │                                     │ zincir dışı doğrula,       │
    │                         │                                     │ relayer cüzdanıyla imzala ▶│ vote(): ispatı doğrula,
    │                         │                                     │                            │ nullifier'ı işaretle, say
    │                         │ 4. takip / sonuçlar ◀───────────────│◀───────────────────────────│ getResults()
```

1. Yönetici, seçmenlerin kimlik numarası karmalarından bir Merkle ağacı kurar ve kökü sözleşmeye yazar.
2. Seçmen kayıt olur; sunucudan ağaçtaki yolunu (kardeş düğümler) alır. Yol tarayıcıda saklanır.
3. Oy verirken tarayıcı, snarkjs ile bir Web Worker içinde ispat üretir: "bu ağaçtayım" ama kim olduğunu söylemez. İspat bir nullifier da üretir.
4. İspat relayer'a gider. Seçmenin cüzdanı yoktur; relayer işlemi kendi cüzdanıyla imzalar ve gas'ı öder.
5. Sözleşme ispatı doğrular, kullanılmış nullifier'ı reddeder ve oyu sayar.

## Gereksinimler

- Node.js 24 (`.nvmrc`)
- pnpm 12 — `npm i -g pnpm@12` (kökteki `packageManager` alanı sürümü sabitler)
- Devre geliştirme için: circom 2.x (bkz. `packages/circuits/README.md`)

## Kurulum ve çalıştırma

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # varsayılan CHAIN_MODE=mock
# .env.local içinde ADMIN_TOKEN'ı doldurun: openssl rand -hex 32
pnpm dev                                        # http://localhost:3000
```

Mock modda hızlı deneme:
1. `/admin` → ADMIN_TOKEN ile giriş yapın → **Kökü yayınla**.
2. `/register` → sentetik kimlik: `00000000001` … `00000000016`.
3. `/vote` → aynı kimlik + aday seçin → ispat üretilir, oy relayer'a gider.
4. `/track` ile işlemi, `/results` ile sonuçları görün.

### Komutlar (kök dizinden)

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Web uygulamasını geliştirme modunda başlatır |
| `pnpm build` | Tüm paketleri derler (`next build` + `hardhat build`) |
| `pnpm lint` | ESLint |
| `pnpm test` | Sözleşme testleri |
| `pnpm chain` | Yerel Hardhat ağı (`http://127.0.0.1:8545`) |
| `pnpm deploy:local` | Voting + MockVerifier'ı yerel ağa dağıtır |

### Çalışma modları

| Mod | Nasıl | Not |
|---|---|---|
| **mock** (varsayılan) | `CHAIN_MODE=mock` | Zincir bellekte; sunucu yeniden başlayınca sıfırlanır |
| **Yerel Hardhat** | `pnpm chain`, `pnpm deploy:local`, `.env.local`: `CHAIN_MODE=rpc`, `ALCHEMY_RPC_URL=http://127.0.0.1:8545`, `CHAIN_ID=31337`, adres + test hesabı anahtarı | `Voting.vote()` henüz `NotImplemented` ile geri döner |
| **Sepolia** | Alchemy RPC URL, dağıtılmış adres, test ağı cüzdanı | Sözleşme ve devre hazır olunca |

Sözleşme dağıtımı için anahtarlar `.env` yerine Hardhat'in şifreli keystore'unda tutulur:
```bash
cd packages/contracts
pnpm hardhat keystore set SEPOLIA_RPC_URL
pnpm hardhat keystore set SEPOLIA_PRIVATE_KEY
```

## Klasör yapısı

```
apps/web/                     Next.js (App Router): ön uç + relayer API
  src/app/                    sayfalar: / register vote track results admin
  src/app/api/                vote · merkle-proof · track · admin/merkle-root
  src/lib/zk/                 generateVoteProof(), Web Worker, prover backend'leri
  src/lib/merkle/             karma fonksiyonu + Merkle ağacı (tarayıcı ve sunucu ortak)
  src/server/                 yalnızca sunucu: env, zincir istemcisi, doğrulayıcı, relayer
  data/synthetic-voters.json  SENTETİK seçmen listesi
  public/zk/                  devre çıktıları (vote.wasm, vote_final.zkey) buraya kopyalanır
packages/contracts/           Hardhat 3: IVoting.sol, Voting.sol (taslak), IVerifier.sol
packages/circuits/            Circom klasör yapısı, derleme betikleri, devre arayüzü
```

## Geçiş noktaları (mock → gerçek)

| # | Ne | Dosya | Gerçeğe geçiş |
|---|---|---|---|
| 1 | İspat üretimi | `apps/web/src/lib/zk/backend/index.ts` | Tek satır: `snarkjsBackend` |
| 2 | Karma fonksiyonu | `apps/web/src/lib/merkle/hash.ts` | `fieldHash` → Poseidon |
| 3 | Relayer doğrulaması | `apps/web/src/server/zk/verifier.ts` | Tek satır: `snarkjsVerifier` |
| 4 | Zincir | `.env.local` → `CHAIN_MODE` | `rpc` |

1–3 için önce `pnpm --filter @evote/circuits circuits:copy` ile devre çıktıları kopyalanır.

## Güvenlik

- Gerçek anahtarlar repoya girmez: tüm `.env*` dosyaları yok sayılır, yalnızca `.env.example` izlenir.
- Relayer anahtarı yalnızca sunucuda okunur (`server-only`, `NEXT_PUBLIC_` öneki yok).
- Relayer için yalnızca test ağı ETH'si olan, bu projeye ayrılmış bir cüzdan kullanın.
- Gerçek kimlik numarası kullanılmaz. Sentetik kimlikler `0` ile başlar; gerçek T.C. kimlik numaraları 0 ile başlamaz.

## Bilinen sınırlamalar

- **Kimlik modeli ve gizlilik:** Yaprak = `H(kimlikNo)`, nullifier = `H(kimlikNo, seçimId)`.
  Kimlik listesine sahip biri (yönetici, sunucu) her seçmenin nullifier'ını hesaplayıp
  zincirdeki oyla eşleştirebilir; 11 haneli kimlik uzayı kaba kuvvetle de taranabilir.
  Yani oy gizliliği yöneticiye karşı korunmaz. Çözüm (ileride değerlendirilebilir): seçmenin
  tarayıcıda ürettiği gizli bir değerden türeyen taahhüt (Semaphore modeli).
- **Makbuz:** Oy takibi (nullifier/işlem karması) oyun ne olduğunu gösterir; seçmen oyunu
  başkasına kanıtlayabilir (oy satın alma riski).
- **Relayer ağ düzeyinde görür:** İstek atan IP ile zamanlamayı görebilir.
- **Kalıcılık yok:** Seçmen kaydı ve mock zincir bellekte tutulur.
- **Yönetici kimlik doğrulaması** paylaşılan bir anahtardan ibaret (yer tutucu).
