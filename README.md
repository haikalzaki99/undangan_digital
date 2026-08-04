# 💌 Template Website Undangan Pernikahan — Jack Tech

Template website undangan pernikahan digital modern yang dikelola oleh **Jack Tech**. Dibangun dengan HTML, CSS, dan JavaScript murni (Vanilla JS) sehingga ringan dan mudah dikustomisasi.

![Thumbnail](/assets/images/banner.webp)

## ✨ Fitur

- 🎨 Dark & light theme (otomatis mengikuti sistem)
- 💬 Ucapan & doa tamu (komentar), presensi, like, dan reply
- 🖼️ Galeri dengan carousel
- 💝 Love gift (transfer, QRIS, kado)
- ⏳ Countdown menuju hari H
- 📅 Tombol "Save Google Calendar"
- 🎵 Musik latar
- 🎉 Efek konfeti
- 📱 Responsive (desktop & smartphone)

## 🛠️ Tech Stack

- Bootstrap 5.3.8
- AOS 2.3.4
- Font Awesome 7.1.0
- Canvas Confetti 1.9.3
- Google Fonts
- Vanilla JS

## 🚀 Persiapan Lokal

Persyaratan: **Node.js** dan **npm**.

```bash
npm install
npm run dev
```

Buka `http://localhost:8080` untuk melihat hasilnya.

> Undangan ini hanya menggunakan HTML, CSS, dan JavaScript biasa. NPM digunakan agar file JavaScript bisa langsung dieksekusi (bukan bertipe module lagi).

## ✏️ Kustomisasi Konten

Ubah isi file `index.html` sesuai keinginanmu:

- **Nama mempelai, tanggal, alamat, cerita, galeri, love gift** — semua ada di `index.html`.
- **Waktu countdown** — atribut `data-time` di elemen `<body>` (format: `YYYY-MM-DD HH:mm:ss`).
- **Musik** — atribut `data-audio` di `<body>`.
- **Konfeti** — `data-confetti="true"` / `"false"` di `<body>`.
- **SEO** — meta `og:*`, `title`, dan `description` di bagian `<head>`.

## 💬 Fitur Ucapan & Doa (Backend)

Fitur komentar/presensi membutuhkan backend API. Projek ini sudah dikonfigurasi untuk diarahkan ke backend self-host (lihat repo [dewanakl/undangan-api](https://github.com/dewanakl/undangan-api)).

### Setup backend (lokal, Laragon)

```bash
git clone https://github.com/dewanakl/undangan-api.git
cd undangan-api
cp .env.example .env
```

Sesuaikan `.env`:

```ini
BASEURL=http://localhost:8000/

DB_DRIV=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=undangan
DB_USER=root
DB_PASS=

JWT_KEY=<isi_string_acak_panjang>
```

Lalu jalankan:

```bash
composer install --ignore-platform-reqs
php saya key
php saya migrasi --gen
php saya coba
```

API akan berjalan di `http://localhost:8000/`. Akun admin default (ubah segera):

- **Email:** `user@user.com`
- **Password:** `12345678`

### Menghubungkan frontend

1. `data-url` di `<body>` pada `index.html` dan `dashboard.html` → URL backend (contoh: `http://localhost:8000/`).
2. Buka `dashboard.html` → login → menu **Setting** → **Access Key** → klik **Regenerate**, lalu salin key.
3. Tempel key tersebut ke atribut `data-key` di `<body>` `index.html`.

> ⚠️ Aplikasi memerlukan **secure context (HTTPS)**. Untuk preview lokal cukup pakai `localhost`. Untuk produksi pastikan domain sudah HTTPS (Netlify/Vercel sudah HTTPS secara default).

### Jika tidak ingin menggunakan fitur komentar

Hapus atribut `data-key` dan `data-url` di elemen `<body>` pada `index.html`, lalu abaikan `dashboard.html`.

## 📦 Build untuk Deployment

```bash
npm run build:public
```

Folder `public/` adalah hasil akhir yang siap di-upload ke hosting/Netlify/Vercel.

## 🔗 Link Penting

- Frontend template asli: [github.com/dewanakl/undangan](https://github.com/dewanakl/undangan)
- Backend API: [github.com/dewanakl/undangan-api](https://github.com/dewanakl/undangan-api)
- Aset musik: [Pixabay](https://pixabay.com/music/modern-classical-pure-love-304010)

## 📜 Lisensi

Undangan adalah perangkat lunak sumber terbuka berlisensi [MIT](https://opensource.org/licenses/MIT). Template ini merupakan fork yang dikelola oleh **Jack Tech** dengan atribusi asli tetap dipertahankan.
