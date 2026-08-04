# 💌 Undangan Digital — Jack Tech

Sistem undangan pernikahan digital multi-klien yang dikelola oleh **Jack Tech**. Dibangun dengan HTML, CSS, dan JavaScript murni (Vanilla JS), dengan backend API PHP untuk fitur interaktif (ucapan & doa, presensi, konfigurasi).

Satu template sumber (`index.html`) dijadikan halaman tamu per klien lewat tool scaffold, sehingga setiap klien punya halaman sendiri (`clients/{slug}/`) dengan `data-key` dan `data-url` masing-masing.

## ✨ Fitur

- 🎨 Dark & light theme (otomatis mengikuti sistem)
- 💬 Ucapan & doa tamu (komentar), presensi, like, dan reply
- 🖼️ Galeri dengan carousel
- 💝 Love gift (transfer, QRIS, kado)
- ⏳ Countdown menuju hari H (berhenti otomatis di `00:00:00:00`)
- 📅 Tombol "Save Google Calendar"
- 🎵 Musik latar
- 🎉 Efek konfeti
- 📱 Responsive (desktop & smartphone)
- 🧑‍💼 Panel owner untuk kelola akun klien (`owner.html`)

## 🗂️ Struktur Folder

```
undangan-digital/
├── index.html          # Template halaman tamu (sumber untuk scaffold)
├── dashboard.html      # Template dashboard klien
├── owner.html          # Panel owner Jack Tech
├── clients/
│   └── {slug}/         # Halaman per klien (hasil scaffold)
│       ├── index.html  # Halaman tamu klien
│       ├── dashboard.html
│       └── assets/images/  # Gambar milik klien (foto pengantin, bg, dll)
├── assets/             # Aset global (musik, video, gambar template)
├── css/                # Stylesheet
├── js/                 # Source JS (di-bundle ke dist/)
├── dist/               # Hasil bundle esbuild (guest.js, admin.js, owner.js)
└── tools/
    └── scaffold-klien.js  # Alat daftar klien + generate halaman
```

Backend API (`undangan-api`) terhubung lewat dua atribut di elemen `<body>`:
- `data-url` → URL backend API.
- `data-key` → `access_key` klien di database (harus cocok, disuntikkan otomatis oleh scaffold).

## 🚀 Persiapan Lokal

### Frontend

Persyaratan: **Node.js** dan **npm**.

```bash
npm install
npm run dev
```

Buka `http://localhost:8080`.

### Backend API

Clone repo `undangan-api`, sesuaikan `.env` (MongoDB), lalu:

```bash
composer install
php saya key
php saya migrasi
php saya coba
```

API berjalan di `http://localhost:8000/`.

## 👤 Menambah Klien

### Cara disarankan: scaffold (akun DB + halaman sekaligus)

```bash
node tools/scaffold-klien.js "Nama Klien" email@klien.com [password] [--env=local|prod]
```

Yang dilakukan:
1. Mendaftarkan klien via API owner (`POST /api/owner/register`) → membuat baris di database + `access_key`.
2. Membuat folder `clients/{slug}/` berisi `index.html` + `dashboard.html` hasil konfigurasi dari template.
3. Menyalin `assets/images/` ke `clients/{slug}/assets/images/` (aset gambar per klien).
4. Menyuntikkan `data-key` (access_key) dan `data-url` (API) ke halaman klien.

Ringkasan (ID, password, access key, URL tamu/dashboard) dicetak di terminal.

### Via panel owner (`owner.html`)

Tambah klien dari panel owner hanya membuat **akun di database** (belum ada halaman). Untuk halaman undangan, jalankan scaffold di atas. Keduanya saling melengkapi; pastikan `data-key` halaman sama dengan `access_key` klien di database.

> ⚠️ Menambah klien di owner.html **tidak otomatis** membuat folder `clients/{slug}/`. Folder halaman dibuat oleh scaffold.

## ✏️ Kustomisasi Konten (per Klien)

Konten diubah langsung di file klien (disarankan via VS Code):

- **Waktu countdown** — atribut `data-time` di `<body>` (format `YYYY-MM-DD HH:mm:ss`). Logika di `js/app/guest/guest.js` akan berhenti di `00:00:00:00` setelah tanggal lewat.
- **Nama mempelai, tanggal, alamat, cerita, galeri, love gift** — teks dan gambar di `index.html`.
- **Musik** — atribut `data-audio` di `<body>` (global di `/assets/music/`).
- **Konfeti** — `data-confetti="true"` / `"false"` di `<body>`.
- **SEO** — meta `og:*`, `title`, dan `description` di bagian `<head>`.
- **Foto pengantin & gambar** — ganti file di `clients/{slug}/assets/images/` (cowo.webp, cewe.webp, bg.webp, dst.) tanpa menyentuh klien lain.

> 💡 Musik dan video bersifat global (`/assets/music/`, `/assets/video/`) agar tidak menggandakan file besar (11 MB+/klien). Jika klien ingin musik berbeda, letakkan file di folder klien dan ubah `data-audio` ke `clients/{slug}/assets/music/...`.

## 🧪 Lint & Build

```bash
npm run lint:js      # ESLint
npm run lint:css     # stylelint
npm run lint:html    # htmlhint
npx madge --circular js  # cek dependensi sirkular

npm run build        # bundle + minify ke dist/
npm run build:public # build + salin ke folder public/ (hasil siap deploy)
```

## ☁️ Deployment

### Backend — Vercel

1. Hubungkan repo `undangan-api` ke Vercel (Import Project).
2. Atur Environment Variables: `APP_KEY`, `BASEURL`, `JWT_KEY`, `JWT_EXP`, `DB_*`, `MONGODB_URI`, `MONGODB_DB`, `MONGODB_COLLECTION`, `OWNER_KEY`.
3. Pastikan migrasi database sudah dijalankan (`php saya migrasi`).
4. Cek kesehatan: `https://<api-domain>/api/health`.

### Frontend — Vercel

1. Import repo ini ke Vercel sebagai project baru.
2. Pengaturan: Framework Preset `Other`, Build Command `npm run build:public`, Output Directory `public/`.
3. Setiap push otomatis ter-deploy (produksi & preview).

Contoh URL (ganti dengan domain asli):

| Lingkungan | Frontend | API |
|------------|----------|-----|
| local | `http://localhost:8080/` | `http://localhost:8000/` |
| prod | `https://jacktech-web.vercel.app/` | `https://jacktech-api.vercel.app/` |

Untuk klien baru di produksi, jalankan scaffold dengan `--env=prod` (sesuaikan `WEB_BASE` di `tools/scaffold-klien.js` bila domain berbeda).

## 🔗 Link Penting

- Template asli: [github.com/dewanakl/undangan](https://github.com/dewanakl/undangan)
- Backend API: [github.com/dewanakl/undangan-api](https://github.com/dewanakl/undangan-api)
- Aset musik: [Pixabay](https://pixabay.com/music/modern-classical-pure-love-304010)

## 📜 Lisensi

MIT License. Template ini merupakan fork dari [dewanakl/undangan](https://github.com/dewanakl/undangan) yang dikelola oleh **Jack Tech**, dengan atribusi asli tetap dipertahankan.
