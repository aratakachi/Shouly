# SHOULY — Shousetsu Library

## Menjalankan lokal
Dari folder proyek jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`. Jangan membuka index.html langsung dengan file:// karena JSON dan file bab dimuat menggunakan fetch.

## Menambah novel
1. Duplikat `books/_template/`, misalnya menjadi `books/novel-kedua/`.
2. Edit `book.json` di folder baru. Pastikan `id` unik.
3. Simpan cover sebagai `cover.jpg` (atau sesuaikan nilai `cover`).
4. Tambahkan file bab ke `chapters/` dan daftarkan pada array `chapters` di JSON.
5. Tambahkan path JSON ke array `BOOK_INDEX` di `app.js`, misalnya `"books/novel-kedua/book.json"`.
6. Refresh website. Kartu katalog, detail, dan daftar bab muncul otomatis.

## Format isi bab
Gunakan HTML sederhana: `<p>Paragraf pertama.</p>` dan `<p>Paragraf kedua.</p>`.

## Logo
Letakkan logo transparan di `assets/logo.webp`.

## Catatan
Frontend statis tanpa database, login, atau upload mandiri. Isi buku contoh masih placeholder, bukan karya asli. Publikasikan hanya karya yang telah mendapat izin.
