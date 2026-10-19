# @evote/circuits

Oy ispatı için Circom devreleri. **Henüz devre yok.** Bu klasör yalnızca yapıyı,
derleme çıktılarının nereye gideceğini ve diğer paketlerin beklediği arayüzü tanımlar.

## Klasör yapısı

| Yol | İçerik | Git'e girer mi? |
|---|---|---|
| `circuits/` | `.circom` kaynakları (ana devre: `vote.circom`) | Evet |
| `inputs/` | Test için **sentetik** örnek girdiler (`vote.example.json`) | Evet |
| `ptau/` | Powers of Tau dosyası (Faz 1, indirilir) | Hayır (`*.ptau`) |
| `build/` | `vote.r1cs`, `vote.sym`, `vote_js/vote.wasm`, `Groth16Verifier.sol` | Hayır |
| `keys/` | `vote_final.zkey`, `verification_key.json` | Evet (yalnızca son anahtarlar) |
| `scripts/build.sh` | Derleme + güvenilir kurulum adımları (yer tutucu) | Evet |
| `scripts/copy-artifacts.sh` | Son çıktıları diğer paketlere kopyalar | Evet |

Ara zkey dosyaları (`*_0000.zkey`, katkı ara adımları) `.gitignore` ile dışarıda tutulur.

## Çıktılar nereye gider

`pnpm --filter @evote/circuits circuits:copy` şu kopyalamaları yapar:

| Kaynak | Hedef | Kullanan |
|---|---|---|
| `build/vote_js/vote.wasm` | `apps/web/public/zk/vote.wasm` | Tarayıcıdaki ispat üretici (Web Worker) |
| `keys/vote_final.zkey` | `apps/web/public/zk/vote_final.zkey` | Tarayıcıdaki ispat üretici |
| `keys/verification_key.json` | `apps/web/src/server/zk/verification_key.json` | Relayer'ın zincir dışı doğrulaması |
| `build/Groth16Verifier.sol` | `packages/contracts/contracts/Groth16Verifier.sol` | `Voting.sol` (`IVerifier` üzerinden) |

**Neden son anahtarlar commit'leniyor?** Zincirdeki verifier, belirli bir
`vote_final.zkey` dosyasından üretilir. Herkes kendi kurulumunu yaparsa ekipte
herkes farklı anahtarla çalışır ve ispatlar doğrulanmaz. Tek bir kurulum yapılır,
sonuç commit'lenir. Dosyalar onlarca MB'ı aşarsa Git LFS'e geçilmeli.

## Devre arayüz sözleşmesi (teklif — devre ekibiyle teyit edilecek)

Web uygulaması (`apps/web/src/lib/zk/`) ve sözleşme (`IVoting.sol`) şu arayüze
göre yazıldı. Değişirse bu üç yer birlikte güncellenmeli:
`apps/web/src/lib/zk/public-signals.ts`, `apps/web/src/lib/zk/backend/snarkjs.ts`
(`toCircuitInput`) ve `packages/contracts/contracts/IVerifier.sol`.

**Model (ekipçe seçildi):** yaprak = `H(idNumber)`, nullifier = `H(idNumber, electionId)`,
`H` = Poseidon (önerilen). Ağaç derinliği `TREE_DEPTH = 20` (≈1 milyon seçmen).
Web tarafında bu değer `apps/web/src/config/election.ts` içinde tanımlı.

| Sinyal | Tür | Görünürlük | Açıklama |
|---|---|---|---|
| `idNumber` | alan elemanı | özel | Seçmenin kimlik numarası (testte sentetik) |
| `pathElements[20]` | alan elemanı[] | özel | Merkle yolundaki kardeş düğümler |
| `pathIndices[20]` | 0/1[] | özel | Her seviyede düğüm sağda mı (1) solda mı (0) |
| `root` | alan elemanı | **genel** | Sözleşmedeki Merkle kökü |
| `electionId` | alan elemanı | **genel** | Seçim kimliği (nullifier'a bağlanır) |
| `candidateId` | alan elemanı | **genel** | Seçilen aday (0 tabanlı) |
| `nullifierHash` | alan elemanı | **çıktı** | `Poseidon(idNumber, electionId)` |

**`publicSignals` sırası** (snarkjs önce çıktıları, sonra `main` içindeki
`public [...]` listesini bildirim sırasıyla koyar):

```
[0] nullifierHash   [1] root   [2] electionId   [3] candidateId
```

Ana bileşen bu sırayı vermeli:
`component main {public [root, electionId, candidateId]} = Vote(20);`

**Önemli notlar:**
- `candidateId` ispata *bağlı* olmalı. Aksi halde relayer ispatı bozmadan oyu
  değiştirebilir. Genel girdi olması yetmez; devre içinde bir kısıtta
  kullanılmalı (ör. `candidateSquare <== candidateId * candidateId`), yoksa
  derleyici onu optimize edip atabilir. Ayrıca aralık kontrolü
  (`candidateId < candidateCount`) sözleşmede yapılıyor.
- **Bilinen gizlilik sınırlaması:** Nullifier yalnızca `idNumber` ve
  `electionId`'den türediği için, kimlik listesine sahip biri (yönetici, sunucu)
  her seçmenin nullifier'ını hesaplayıp zincirdeki oyla eşleştirebilir. 11
  haneli kimlik uzayı kaba kuvvetle de taranabilir. Kök README'deki "Bilinen
  sınırlamalar" bölümüne bakın.

## Araçlar

- circom 2.x (Rust ile kurulur: <https://docs.circom.io/getting-started/installation/>)
- snarkjs 0.7.x (`apps/web` bağımlılığı olarak zaten var; CLI için `pnpm dlx snarkjs`)
- Önerilen kütüphane: circomlib (Poseidon, MerkleTreeChecker vb.)
