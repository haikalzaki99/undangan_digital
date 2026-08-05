# Maintenance — Undangan Digital Jack Tech

Checklist dan prosedur pemeliharaan untuk sistem undangan digital. Berlaku setelah sistem dipakai produksi. Dokumen ini fokus pada hal-hal yang **harus dijaga** agar tetap sehat dalam jangka panjang.

---

## Ringkasan Stack & Link Produksi

| Komponen | Lokasi / URL |
|---|---|
| Frontend (web) | `https://undangan-digital-delta-wine.vercel.app/` |
| Backend API | `https://undangan-api-six-ashen.vercel.app/` |
| Panel owner | `https://undangan-digital-delta-wine.vercel.app/owner.html` |
| Halaman klien | `https://undangan-digital-delta-wine.vercel.app/clients/{slug}/` |
| Database | Aiven MySQL (free tier) — host `mysql-1db4695e-ekalcmc07-undangan.j.aivencloud.com:24784`, DB `undangan` |
| Repo | frontend `undangan_digital-4.x` (master), backend `undangan-api` (4.x) |
| Deploy | Vercel, auto-deploy setiap push ke GitHub |

---

## 1. Checklist Berkala

### Harian / Mingguan (1–2 menit)
- [ ] Jalankan health check: `node tools/health-check.js` → semua PASS.
- [ ] Cek Aiven service dalam keadaan **Running** (Aiven Console → service undangan). Jika mati, nyalakan (lihat bagian 3).
- [ ] Cek deployment Vercel terbaru berstatus **Ready** (buka Vercel Dashboard / `vercel ls undangan-digital`).
- [ ] Uji 1 alur utuh: buka undangan tamu → login dashboard klien → tulis & hapus komentar → buka owner panel.

### Bulanan
- [ ] **Backup database** (lihat bagian 2) dan simpan di tempat aman.
- [ ] Cek ukuran database (Aiven Console → Storage); free tier terbatas (±5 GB).
- [ ] Cek kuota bulanan Vercel (functions/bandwidth) agar tidak kehabisan.
- [ ] Cek update dependensi: backend (`composer outdated`), frontend CDN (Bootstrap 5.3.8, FontAwesome 7.1.0, AOS 2.3.4, canvas-confetti 1.9.3), dev deps Node.
- [ ] Bersihkan komentar spam / data tidak perlu.

### Per-evento (klien baru)
- [ ] Scaffold klien → commit + push → cek halaman live.
- [ ] Ganti semua gambar placeholder (picsum.photos) dengan foto asli klien.
- [ ] Verifikasi countdown, musik, galeri, love gift, dan Google Maps di halaman klien.

### Per-evento (ganti domain / migrasi)
- [ ] Update `CORS_ORIGINS` di env backend (Vercel) + redeploy.
- [ ] Update `data-url` semua `*.html` (root + `clients/*/`) + `BASEURL` backend.
- [ ] Update `WEB_BASE`, `DATA_URL`, `API_BASE` di `tools/scaffold-klien.js`.
- [ ] Update `SOP-PENJUALAN.md`, `MAINTENANCE.md`, dan `README.md`.

---

## 2. Backup Database

Aiven free tier **tidak menyediakan backup otomatis** — backup manual wajib.

```powershell
& "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe" `
  -h mysql-1db4695e-ekalcmc07-undangan.j.aivencloud.com -P 24784 `
  -u avnadmin -p`"<DB_PASS>`" `
  --ssl-ca="C:\laragon\www\undangan-api\certs\aiven-ca.pem" `
  undangan > "backup-undangan-$(Get-Date -Format yyyyMMdd-HHmm).sql"
```

Restore:

```powershell
& "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" `
  -h mysql-1db4695e-ekalcmc07-undangan.j.aivencloud.com -P 24784 `
  -u avnadmin -p`"<DB_PASS>`" `
  --ssl-ca="C:\laragon\www\undangan-api\certs\aiven-ca.pem" `
  undangan < "backup-undangan-YYYYMMDD-HHmm.sql"
```

> Kredensial DB ada di `.env` backend (`undangan-api/.env`) dan Environment Variables Vercel. Simpan backup di luar mesin (Google Drive, dsb.).

---

## 3. Aiven MySQL Mati (Free Tier)

Gejala: health check gagal pada cek "API + database", atau halaman klien error saat memuat komentar/config.

Langkah:
1. Buka [Aiven Console](https://console.aiven.io) → service **undangan**.
2. Klik **Power on** / Restart jika status `POWERED_OFF`.
3. Tunggu status `RUNNING`, lalu jalankan ulang health check.

> Free tier Aiven bisa otomatis mati jika tidak aktif / kuota. Jika sistem sudah dipakai serius, pertimbangkan upgrade tier berbayar agar tidak ada downtime.

---

## 4. Rotasi Kunci

Jika kunci bocor atau untuk kebersihan berkala:

- **`OWNER_KEY`**, **`APP_KEY`**, **`JWT_KEY`**: ganti di `.env` lokal **dan** Environment Variables Vercel (Production), lalu redeploy backend.
- Setelah `APP_KEY` berubah, **hash di URL health check ikut berubah** — skrip `tools/health-check.js` menghitung otomatis dari `APP_KEY`, jadi tidak perlu diubah manual.
- **Access key klien**: bisa di-rotate via panel owner (`owner.html` → edit klien → rotate key). Setelah rotate, `data-key` di halaman klien harus disesuaikan.
- Pastikan kunci **tidak pernah masuk git** (`.gitignore` sudah mengabaikan `.env`).

---

## 5. Update Dependensi

### Backend (PHP / composer)
```bash
cd C:\laragon\www\undangan-api
composer update
```
Lalu uji: jalankan lokal (`php saya coba`), health check, smoke test, baru push. Perhatikan kompatibilitas dengan runtime `vercel-php@0.6.2`.

### Frontend CDN (pinned + integrity hash)
Bootstrap 5.3.8, FontAwesome 7.1.0, AOS 2.3.4, canvas-confetti 1.9.3 didefinisikan di `<head>` semua HTML dengan atribut `integrity`. Jika versi di-update, hash `integrity` harus dihitung ulang (mis. pakai [SRI Hash Generator](https://www.srihash.org/)). Konsisten di semua file (root + `clients/*/`).

### Dev deps Node
```bash
npm update
npm run lint:js && npm run lint:css && npm run lint:html
npm run build:public
```

---

## 6. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Health check gagal di cek API + DB | Aiven mati / kuota habis / kredensial berubah | Power on Aiven (bagian 3); cek `DB_*` di env Vercel |
| Panel owner: "Network error or rate limit exceeded" | `data-url` di `owner.html` masih localhost / salah | Pastikan `data-url="https://undangan-api-six-ashen.vercel.app/"` lalu deploy |
| Scaffold: `email sudah ada!.` | Email memang sudah terdaftar di DB | Cek via `owner.html`; hapus user lama lalu scaffold ulang, atau pakai email lain |
| Loading tamu pertama lambat | Cold start serverless Vercel + DB remote + gambar picsum | Biasanya hanya kunjungan pertama; ganti placeholder dengan aset lokal; lihat poin 8 |
| Deploy Vercel gagal | Error JS/CSS saat build | Jalankan lint + `build:public` lokal sebelum push |
| CORS error di browser | Origin tidak ada di `CORS_ORIGINS` | Tambahkan origin di env Vercel + redeploy |

---

## 7. Risiko yang Perlu Diketahui

- **Rate limit belum aktif di produksi** — middleware rate limit butuh MongoDB (`MONGODB_URI`). Tanpa itu, tidak ada proteksi brute-force login / spam komentar.
- **Backup manual** — belum ada otomatisasi; backup bulanan wajib (bagian 2).
- **Domain `*.vercel.app`** — direkomendasikan domain kustom untuk branding & portabilitas.
- **Cold start** — kunjungan pertama setiap klien/30 menit bisa terasa lambat; ini normal di serverless free.

---

## 8. Catatan Performa

- **Loading screen** hanya hilang setelah config API + komentar + **semua gambar** selesai. Gambar dari `picsum.photos` (placeholder) memperlambat kunjungan pertama — ganti dengan foto lokal (webp) di `clients/{slug}/assets/images/`.
- Aset global (musik/video) sengaja satu copy (`/assets/music`, `/assets/video`) untuk menghemat ukuran.
- Setelah kunjungan pertama, config (30 mnt), komentar (30 dtk), gambar & libs di-cache oleh browser (Cache API) → kunjungan berikutnya cepat.

---

Dokumen ini adalah panduan hidup — perbarui setiap kali ada perubahan arsitektur (domain, provider, kredensial, dependensi besar).
