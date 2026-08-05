# SOP Penjualan — Undangan Digital Jack Tech

Standard Operating Procedure untuk proses penjualan jasa pembuatan undangan digital. Berlaku untuk owner/petugas penjualan Jack Tech.

---

## 1. Tujuan & Ruang Lingkup

- Menjaga konsistensi kualitas layanan dan pengalaman calon klien.
- Memperjelas alur dari prospek hingga serah terima dan after-sales.
- Menghindari kesalahan data, revisi berlebihan, dan keterlambatan pengerjaan.

## 2. Produk

Undangan pernikahan digital berbasis website dengan fitur:

- Halaman tamu responsif (mobile & desktop).
- Countdown menuju hari H.
- Musik latar, galeri foto, cerita, lokasi, tombol Google Calendar.
- Ucapan & doa, presensi, like, dan reply (perlu backend).
- Love gift (transfer / QRIS / kado).
- Dashboard klien untuk melihat ucapan & statistik.
- Domain/URL khusus per klien.

## 3. Paket & Harga

*Isi sesuai ketentuan yang berlaku. Contoh tabel di bawah.*

| Paket | Fitur | Harga |
|-------|-------|-------|
| Paket Basic | ___ | Rp ___ |
| Paket Standard | ___ | Rp ___ |
| Paket Premium | ___ | Rp ___ |

Ketentuan umum:

- Harga tidak termasuk biaya domain custom (jika diminta).
- Penambahan fitur di luar paket dikenakan biaya tambahan.
- Diskon / promosi sesuai kebijakan yang berlaku.

## 4. Alur Penjualan

### Langkah 1 — Kontak awal
- Prospek menghubungi via WhatsApp/Instagram/sosial media.
- Balas maksimal ___ menit/jam. Sapa dengan ramah dan kenalkan produk singkat.

### Langkah 2 — Penawaran
- Kirim info paket + harga + contoh/portofolio.
- Tawarkan konsultasi kebutuhan (tanggal acara, tema, jumlah fitur).

### Langkah 3 — Kesepakatan & DP
- Konfirmasi paket, harga final, dan estimasi pengerjaan.
- Minta DP sebesar ___% (mis. 50%) sebagai tanda jadi.
- Simpan bukti transfer dengan format nama yang jelas.

### Langkah 4 — Pengumpulan data & materi
- Kirimkan checklist data klien (lihat bagian 5).
- Tunggu seluruh data & materi (foto, teks, musik) sebelum mulai pengerjaan.

### Langkah 5 — Pengerjaan
- Buat halaman klien (lihat bagian 8 — Catatan Teknis).
- Isi konten sesuai data, upload gambar/materi klien.
- Uji halaman (desktop & mobile) sebelum dikirim untuk preview.

### Langkah 6 — Preview & revisi
- Kirim link preview ke klien.
- Maksimal ___x revisi gratis (di luar itu dikenakan biaya / sesuai kebijakan).
- Selesaikan revisi dalam ___ hari kerja.

### Langkah 7 — Pelunasan & serah terima
- Minta pelunasan sebelum serah terima final.
- Setelah pelunasan, berikan link final + info dashboard klien.
- Berikan panduan singkat cara menggunakan dashboard (opsional).

### Langkah 8 — After-sales
- Tanya kabar/kendala beberapa hari setelah acara.
- Sediakan kontak support untuk perbaikan/pertanyaan.
- Minta testimoni / rekomendasi (tawarkan insentif sesuai kebijakan).

## 5. Checklist Data dari Klien

- [ ] Nama lengkap kedua mempelai (+ keluarga/sapaan).
- [ ] Tanggal & jam acara (untuk countdown).
- [ ] Nama lokasi / alamat acara.
- [ ] Nama bank / nomor rekening & QRIS (untuk love gift).
- [ ] Foto pasangan (min. ___ file, resolusi layar HP).
- [ ] Foto galeri (bila paket menyediakan galeri).
- [ ] Musik latar (file MP3 atau izin pakai musik bawaan).
- [ ] Teks: pembukaan/ayat, kisah singkat, susunan acara, ucapan.
- [ ] Daftar tamu / template teks undangan untuk dibagikan (opsional).

## 6. Ketentuan Pembayaran & Revisi

- Pembayaran melalui: ___ (transfer bank, e-wallet, dll).
- DP minimal ___% ; pelunasan maksimal ___ hari sebelum serah terima / sebelum acara.
- Revisi gratis maksimal ___x ; revisi tambahan ___/revisi.
- Garansi: ___ hari pasca serah terima untuk perbaikan bug/konten minor.
- Bila klien batal: kebijakan pengembalian ___ .

## 7. Template Chat / Script WhatsApp

### Penawaran awal
> Halo kak ___! Terima kasih sudah menghubungi Jack Tech 🙏
> Kami menyediakan undangan digital dengan harga mulai Rp ___, fiturnya lengkap (countdown, musik, galeri, ucapan & doa, love gift, dan lainnya).
> Boleh kami tahu tanggal acaranya kapan? Nanti kami bantu pilihkan paket yang pas 😊

### Follow-up (jika belum ada keputusan)
> Kak, bagaimana kira-kira? Kalau ada pertanyaan seputar paket/undangan digital, silakan tanya-tanya dulu ya. Kami siap bantu 😊

### Serah terima
> Halo kak ___! Undangan digitalnya sudah selesai dan siap dibagikan 🎉
> Link final: <link>
> Dashboard klien: <link> (email: <email>)
> Jangan ragu hubungi kami kalau ada revisi atau kendala. Terima kasih telah mempercayakan Jack Tech 🙏

## 8. Catatan Teknis Pengerjaan (Internal)

> ⚠️ Bagian ini untuk tim teknis, bukan untuk dikirim ke klien.

- **Link produksi saat ini** (perbarui bila nanti dipasang domain kustom):
  - Panel Owner: `https://undangan-digital-delta-wine.vercel.app/owner.html` — akses memakai `OWNER_KEY` yang sama dengan di `../undangan-api/.env` (jangan share/nilai ke klien).
  - Web utama: `https://undangan-digital-delta-wine.vercel.app/`
  - API: `https://undangan-api-six-ashen.vercel.app/`
  - Halaman tamu: `https://undangan-digital-delta-wine.vercel.app/clients/{slug}/`
  - Dashboard klien: `https://undangan-digital-delta-wine.vercel.app/clients/{slug}/dashboard.html`

- **Daftar + buat halaman klien** (akun DB + halaman sekaligus):
  ```bash
  node tools/scaffold-klien.js "Nama Klien" email@klien.com <password> --env=prod
  ```
  Catatan: scaffold mendaftarkan klien via API owner **dan** membuat `clients/{slug}/` + menyalin `assets/images/`. Owner key dibaca otomatis dari `../undangan-api/.env`. URL default produksi sudah terset di `tools/scaffold-klien.js` (`WEB_BASE`, `DATA_URL`) — sesuaikan bila domain berubah.

- **Edit konten per klien** di `clients/{slug}/index.html`:
  - Countdown: `data-time="YYYY-MM-DD HH:mm:ss"` di `<body>`.
  - Musik: `data-audio` di `<body>`.
  - Foto: ganti file di `clients/{slug}/assets/images/` (cowo.webp, cewe.webp, bg.webp, dll).
  - Teks/tanggal/lokasi: bagian terkait di `index.html`.

- **After edit**:
  ```bash
  npm run lint:js && npm run lint:css && npm run lint:html
  npm run build:public
  ```
  Folder `public/` adalah hasil deploy. Push ke GitHub → Vercel auto-deploy.

- **Verifikasi**: buka `https://undangan-digital-delta-wine.vercel.app/clients/{slug}/?to=Nama` (halaman tamu) dan `https://undangan-digital-delta-wine.vercel.app/clients/{slug}/dashboard.html` (dashboard klien). Pastikan semua gambar & musik termuat dan countdown berjalan.

- **Reset password / nonaktifkan / hapus klien**: lakukan via panel owner `https://undangan-digital-delta-wine.vercel.app/owner.html`.

- **Cek status produksi** (API + DB, owner key, web, semua halaman klien):
  ```bash
  node tools/health-check.js   # exit code 0 = semua OK
  ```
  Checklist berkala, backup DB, rotasi kunci, dan troubleshooting: **`MAINTENANCE.md`**.
