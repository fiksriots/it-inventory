# 📓 Changelog — IT Inventory & Operations System

Semua perubahan besar, penambahan modul baru, perbaikan bug, dan migrasi skema basis data pada aplikasi **IT Inventory** akan dicatat secara teratur di dokumen ini.

---

## 🚀 [2.0.0] — 2026-05-17 (Major Release: IT Operations Suite)

Rilis besar **Versi 2.0.0** menandai transformasi aplikasi IT Inventory dari sekadar manajemen stok barang menjadi **Platform Operasional IT terpadu** yang memfasilitasi perencanaan kerja, pengawasan anggaran belanja, dan pelaporan harian tim IT Support secara terintegrasi.

### 🆕 Fitur Baru yang Ditambahkan:
1.  **IT Project Planning & Tracking Dashboard**:
    *   Dasbor kemajuan proyek interaktif untuk memonitor pengerjaan infrastruktur IT jangka panjang.
    *   Sistem status multi-tahap berkode warna: `Planning` (Kuning), `In Progress` (Biru), `On Hold` (Merah), dan `Completed` (Hijau).
    *   Bilah kemajuan (*progress bar*) dinamis yang menyesuaikan kemajuan proyek dalam persentase (%).
2.  **Rencana Anggaran Biaya (RAB) / Project Costing Module**:
    *   Modul penyusunan anggaran belanja pengadaan perangkat keras, lunak, atau jasa teknisi yang terikat langsung pada setiap proyek IT.
    *   Kalkulator biaya dinamis dengan penambahan/penghapusan item anggaran secara realtime.
    *   Format otomatis mata uang Rupiah (`formatRupiah`) di seluruh dasbor kartu proyek dan halaman detail.
3.  **Laporan Kerja Harian (Daily Activity Log) Unified Feed**:
    *   Lini masa (*timeline*) kronologis yang menyajikan seluruh aktivitas operasional IT harian secara terpadu.
    *   **Unifikasi data otomatis**: Secara cerdas menggabungkan Laporan Harian Mandiri (aktivitas perawatan/troubleshooting umum) dan Laporan Progres Proyek dari modul Project Planning.
    *   Fitur filter cepat berdasarkan status penyelesaian (`Selesai`, `Pending`, `Terhambat`) dan filter pencarian kalender tanggal.
    *   Tautan silang interaktif (🔗) pada laporan tipe proyek untuk navigasi sekali klik menuju detail proyek terkait.
4.  **Sistem Unggah Dokumentasi & Premium Lightbox**:
    *   Modul pengunggahan file gambar bukti fisik hasil pengerjaan tim IT Support di lapangan.
    *   Pembersih *preview* instan dan validasi ukuran file maksimal 5MB sebelum disimpan.
    *   **Lightbox Modal Popup** resolusi tinggi dengan efek kaca buram transparan (*backdrop-blur*) yang mewah untuk melihat foto bukti kerja.
5.  **Skema Migrasi Database Relasional & Keamanan RLS**:
    *   Berkas migrasi SQL `20260517130000_create_project_planning.sql` dan `20260517150000_create_it_daily_logs.sql`.
    *   Konfigurasi relasi foreign key `ON DELETE CASCADE` untuk menjaga kebersihan data.
    *   Kebijakan Row Level Security (RLS) di Supabase untuk membatasi hak akses data hanya kepada pengguna terautentikasi (`authenticated`).

### ⚙️ Peningkatan & Perbaikan Sistem (Improvements & Bug Fixes):
*   **Defensive Stale Log Self-Healing Check**: Menambahkan penangkap data log usang di sisi klien untuk mengeliminasi ID sementara tanpa memicu tabrakan tipe data UUID di server PostgreSQL/Supabase.
*   **SQL Schema Fallback Screen**: Menyediakan layar darurat interaktif yang menampilkan salinan skrip SQL lengkap sekali klik jika basis data belum diinisialisasi.
*   **Sidebar Navigation Redesign**: Menyederhanakan tata letak menu navigasi utama dengan mengelompokkan menu operasional penting di bawah modul **Ringkasan** utama.
*   **Volume Mount Docker Production Config**: Mengonfigurasi direktori penyimpanan gambar di disk server Linux `/public/uploads/` agar bersifat permanen, aman, dan durabel dari restart kontainer Docker Next.js.
*   **TypeScript Type-Safety Validation**: Menjamin 100% kepatuhan tipe data dengan lolos pengecekan kompilasi `npx tsc --noEmit` dengan 0 Error.

---

## 📅 [1.1.0] — 2026-05-16
*   **Added**: Kalender jadwal kerja IT Support harian dengan cutoff otomatis tanggal 24 bulanan.
*   **Added**: Peta integrasi hari libur nasional Indonesia (Hari Besar) dengan warna latar penanda kuning.

---

## 📅 [1.0.0] — 2026-05-15
*   **Added**: Modul Master Data Barang, Kategori Barang, Mutasi Transfer barang antardepartemen, dan Purchase Order (PO) logistik.
*   **Added**: Dashboard status ringkasan stok aset komputer dan infrastruktur fasilitas kantor.
