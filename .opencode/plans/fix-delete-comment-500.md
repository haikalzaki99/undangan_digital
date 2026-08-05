# Rencana: Fix Delete Komentar 500 + Sisa Test Runtime

Status: **Disetujui user** ("Ya, lanjut semua") — menunggu eksekusi (permission edit hanya mengizinkan file plans).

## Temuan (Root Cause)
- Endpoint `DELETE /api/comment/{own}` mengembalikan 500 kosong untuk komentar yang memiliki balasan.
- Log (`cache/log/kamu.log`, dengan `LOG=true`): `"Uncompleted deletion: comments=1"` pada SQL `DELETE FROM comments WHERE user_id = ? AND uuid IN (?, ?);`.
- Penyebab: tabel `comments` punya FK `FK_comments_parent_id (parent_id) REFERENCES comments(uuid) ON DELETE CASCADE`. Saat parent dihapus, balasan ikut terhapus otomatis (cascade), tetapi `rowCount()` MySQL hanya menghitung baris yang kena statement langsung (=1), bukan baris cascade.
- `CommentRepositories::deleteAllByUuid` membandingkan `count($commentUuids) === $deletedComments` → `2 !== 1` → throw `Exception` → `DB::transaction` rollback → 500. Artinya **setiap delete komentar berbalasan selalu gagal**.

## Langkah 1 — Fix `deleteAllByUuid`
File: `C:\laragon\www\undangan-api\app\Repositories\CommentRepositories.php` (sekitar baris 124-158).

Ganti blok `DB::transaction`:

```php
return DB::transaction(function () use ($commentUuids, $userId, $uuid): bool {

    Like::where('user_id', $userId)
        ->whereIn('comment_id', $commentUuids)
        ->delete();

    $deletedComments = Comment::where('user_id', $userId)
        ->where('uuid', $uuid)
        ->delete();

    if ($deletedComments === 1) {
        return true;
    }

    throw new Exception('Uncompleted deletion: comments=' . strval($deletedComments));
});
```

Catatan:
- Hapus cukup root (`uuid = $uuid`); CASCADE menghapus semua balasan turunannya.
- Pertahankan loop pengumpulan `$commentUuids` (balasan) karena tabel `likes` TIDAK punya FK ke `comments` — likes milik komentar yang terhapus harus dibersihkan manual.
- `$uuid` harus ditambahkan ke `use` closure.
- Tidak ada pola serupa lain: grep membuktikan hanya `deleteAllByUuid` yang pakai perbandingan count; tidak ada endpoint hapus user.

## Langkah 2 — Re-test Delete
API dev server: `php -S localhost:8000 -t public` (PID 5380, `.env` saat ini `DEBUG=true` & `LOG=true`).
- Header: `User-Agent` Mozilla asli, `x-access-key` = access_key "Tes Login" (`a6e0fa4ee0ea76bf3dd5d6f69ecbcfa0c40119011b98db4e5c`), `Accept: application/json`.
- `DELETE /api/comment/58cf7b38-6f62-4ef1-a5e1-baa2c6fef690` (own milik uuid `f1446b9e-02ee-4686-8190-643f2f724092`, id 9, punya balasan `b8893720-d2e6-4400-9f24-6c29d2ac83b7`, id 10).
- Ekspektasi: `200` `{"status":true}`.
- Verifikasi DB (read):
  ```sql
  SELECT id, uuid, user_id, parent_id FROM comments WHERE user_id=8;
  SELECT id, comment_id, user_id FROM likes WHERE user_id=8;
  ```
  → keduanya kosong.
- `php -l app/Repositories/CommentRepositories.php` wajib lolos sebelum test.

## Langkah 3 — Re-test Unlike
- Buat komentar/like baru dulu (karena data Langkah 2 terhapus):
  - `POST /api/comment` (access_key sama) → 201, dapat `uuid` & `own`.
  - `POST /api/comment/{uuid}` (like) → 201, dapat like-uuid.
- `PATCH /api/comment/{like_uuid}` → 200 (unlike). **Penting: pakai like-uuid, bukan comment-uuid** (karena `LikeRepositories::getByUuid` memfilter `like.uuid`).
- Verifikasi DB: `likes` hilang.

## Langkah 4 — PATCH /api/user (flags bool)
- `GET /api/user` → 200, cek isi flags.
- `PATCH /api/user` body e.g. `{"filter":false,"confetti_animation":true,"can_reply":false}` → 200; `GET` ulang untuk verifikasi tersimpan.
- Body invalid (e.g. `"filter":"abc"`) → 400 (buktikan `UpdateUserRequest` bool rules jalan).

## Langkah 5 — GET /api/download (CSV formula)
- `GET /api/download` + access_key → 200, header `Content-Type` CSV + `Content-Disposition`.
- Verifikasi baris yang diawali `=`, `+`, `-`, `@`, tab, CR diprefiks `'` (hasil sanitize `DashboardController::download`).
- Jika data kosong, buat 1 komentar diawali `=cmd` dulu lalu download lagi.

## Langkah 6 — CORS via HTTP
- Request dengan header `Origin: http://localhost:8080` → respons punya `Access-Control-Allow-Origin: http://localhost:8080`.
- Request dengan `Origin: http://evil.example` → TIDAK ada `Access-Control-Allow-Origin`.
- Request `OPTIONS` (preflight) dengan Origin diizinkan → 200 + header CORS.

## Langkah 7 — Frontend Runtime
- `python -m http.server 8080` (atau setara) di direktori `public/` (frontend, `C:\laragon\www\undangan_digital-4.x\public`).
- `GET http://localhost:8080/clients/test-klien/index.html` → 200.
- Validasi seluruh asset page itu (css/js/img) → 200, tanpa 404.
- `node --check dist/guest.js`, `dist/admin.js`, `dist/owner.js` → lolos.
- Sampel halaman lain: `/index.html`, `/dashboard.html`, `/owner.html` → 200.

## Langkah 8 — Cleanup
- Hapus data uji:
  - Jika belum terhapus oleh test: komentar/like milik user 8 via API delete (sekarang seharusnya berhasil).
  - Hapus user 8 "Tes Login" langsung di DB (tidak ada endpoint hapus user): `DELETE FROM users WHERE id=8;` (FK CASCADE membersihkan comments-nya; likes dibersihkan manual dulu bila masih ada).
- Restore `.env` backend: `DEBUG=false`, `LOG=false` (kembalikan nilai asli).
- Stop API server (PID 5380) dan server 8080 frontend; biarkan MySQL jalan (opsional).
- Hapus `cache/log/kamu.log` bila perlu (file debug).

## Langkah 9 — Commit
- Branch `4.x` (backend `undangan-api`).
- Commit: `fix: delete comment with replies (FK cascade rowcount mismatch)`.
- TIDAK push kecuali diminta.

## Kriteria Selesai
- [ ] `php -l` lolos.
- [ ] Delete komentar berbalasan → 200 + DB bersih.
- [ ] Unlike → 200.
- [ ] PATCH /api/user flags tersimpan; invalid → 400.
- [ ] CSV formula tersanitasi.
- [ ] CORS allowlist benar (izin asal diizinkan, asing tidak).
- [ ] Halaman frontend + asset 200 tanpa 404; dist valid.
- [ ] Data uji & setting debug dibersihkan.
- [ ] Commit fix dibuat.
