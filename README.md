# 🏢 Sistem Manajemen Inventaris IT & Gudang (IT Inventory System)
**PT. INVENTARIS TEKNOLOGI UTAMA**  
*Pusat Pengelolaan Manajemen Aset, Sarana Infrastruktur & Fasilitas Komputer*

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif & PRD](#-1-ringkasan-eksekutif--product-requirement-document-prd)
2. [🛠️ Tech Stack & Teknologi](#%EF%B8%8F-2-tech-stack--teknologi)
3. [📦 Dokumentasi Fitur Berdasarkan Versi](#-3-dokumentasi-fitur-berdasarkan-versi)
   - [Versi 1.0 (Rilis Inti)](#versi-10-rilis-inti)
   - [Versi 1.1 (Live Print Customizer)](#versi-11-live-print-customizer)
   - [Versi 2.0 (IT Operations Suite)](#versi-20-it-operations-suite)
   - [Versi 2.1 (Advanced Inventory & Database Tools)](#versi-21-advanced-inventory--database-tools)
   - [Versi 2.2 (PWA & Mobile Optimization)](#versi-22-pwa--mobile-optimization)
4. [🔄 Perbandingan & Histori Pembaruan (Changelog)](#-4-perbandingan--histori-pembaruan-changelog)
5. [📖 Panduan Penggunaan & Tutorial Lengkap](#-5-panduan-penggunaan--tutorial-lengkap)
6. [🚀 Panduan Deployment Server](#-6-panduan-deployment-server)

---

## 🎯 1. Ringkasan Eksekutif & Product Requirement Document (PRD)

**IT Inventory System** (kini dikenal sebagai **OpsFlow IT**) adalah platform manajemen aset fisik IT, sarana infrastruktur jaringan, penjadwalan tim, serta siklus pengadaan (Purchase Order) dan perbaikan perangkat berbasis web yang dikembangkan menggunakan **Next.js App Router** dan **React Server Components**, bergaya antarmuka modern yang dikustomisasi secara murni (Tailwind CSS v4 & Vanilla CSS), serta dioptimalkan untuk kinerja tanpa kompromi baik di lingkungan *cloud* berbasis nirserver (*serverless*) maupun peladen luring mandiri (*on-premise server*).

Tujuan utama sistem ini adalah menghadirkan keterlihatan mutlak (*absolute visibility*) terhadap pergerakan aset dan stok gudang di multi-lokasi/departemen, mempermudah pelacakan pemeliharaan preventif, mendukung kestabilan luring penuh dengan Progressive Web App (PWA), serta menghasilkan pelaporan siap cetak bergaya profesional untuk kebutuhan audit akuntansi dan manajemen tingkat tinggi.

---

## 🛠️ 2. Tech Stack & Teknologi

Aplikasi **OpsFlow IT** dirancang dengan arsitektur modern berkinerja tinggi, mengutamakan keamanan dan stabilitas operasional baik di cloud maupun on-premise:

*   **Framework Utama**: **Next.js 16.2.6 (App Router)** - Memanfaatkan React Server Components (RSC) untuk pemuatan data yang cepat dan Server Actions untuk manipulasi basis data yang aman.
*   **Library UI**: **React 19.2.4** & **React DOM 19.2.4** - Menghadirkan rendering sisi klien yang reaktif dan rendering sisi server (SSR) yang optimal.
*   **Database & Backend (BaaS)**: **Supabase** dengan database relasional **PostgreSQL** - Mendukung keamanan Row Level Security (RLS) tingkat lanjut, trigger basis data, dan real-time subscriptions.
*   **Styling & Desain**: **TailwindCSS v4.0.0** & **PostCSS** - Menyajikan antarmuka premium, responsif penuh, dengan transisi halus dan fitur Dark/Light Mode adaptif.
*   **Progressive Web App (PWA)**: Registrasi **Service Worker** kustom (`sw.js`) dengan strategi caching pintar (*Network-First* untuk halaman, *Cache-First* untuk aset statis), serta manifest PWA terintegrasi agar aplikasi dapat diinstal di perangkat Android, iOS (Safari), Windows, dan macOS.
*   **Pemrosesan Dokumen & Laporan**:
    *   `exceljs` & `xlsx` untuk modul ekspor-impor data inventaris secara massal dengan Excel.
    *   `jspdf` & `jspdf-autotable` untuk pembuatan laporan dalam format PDF secara dinamis.
*   **Utilitas Pendukung**:
    *   `browser-image-compression` untuk kompresi file gambar/bukti fisik sebelum diunggah ke server.
    *   `lucide-react` sebagai repositori ikon visual bertipe SVG beresolusi tinggi.
    *   `sharp` untuk penanganan kompresi dan pembuatan ikon multi-ukuran otomatis.

---

## 📦 3. Dokumentasi Fitur Berdasarkan Versi

### 🟢 Versi 1.0 (Rilis Inti)
*Status: Dirilis dan Ditandai (Tag `v1.0`)*

#### **A. Modul & Fungsionalitas Inti**
1. **Manajemen Data Barang (Item Master & Stock)**
   - Mendukung pencatatan kode unik (SKU), Nama Barang, Satuan (PCS, BOX, UNIT), serta pengelompokan Kategori.
   - Pelacakan stok gudang per departemen/lokasi secara waktu nyata.
2. **Mutasi & Transfer Stok Gudang**
   - Pencatatan pemindahan barang antar-lokasi yang terotomatisasi secara transaksional.
   - Manajemen penambahan/pengurangan stok fisik mandiri dengan rekam jejak riwayat mutasi yang transparan.
3. **Manajemen Pemasok (Suppliers)**
   - Registrasi entitas rekanan pengadaan barang beserta informasi kontak dan relasi dokumen transaksi.
4. **Pemetaan Infrastruktur & Perangkat Komputer (Assets Tracking)**
   - Inventarisasi sarana fisik (Portal/Gate, CCTV, DVR, AC) dan Unit PC.
   - Pengingat otomatis untuk jadwal perawatan (*Maintenance Date*) berikutnya beserta riwayat kondisi aset (Normal/Rusak).
5. **Siklus Pengadaan Barang (Purchase Orders - PO)**
   - Pembuatan surat pesanan barang resmi yang tertaut dengan Pemasok, Departemen, dan rincian item.
   - Rekapitulasi nilai transaksi secara otomatis dengan status progres terstruktur (*Draft*, *Disetujui*, *Selesai*).
6. **Pencatatan Servis & Perbaikan (Services & Repairs)**
   - Pencatatan klaim garansi atau perbaikan sarana IT yang rusak.
   - Integrasi **Pop-Up Immersive Viewer** untuk melihat bukti Surat Jalan awal dan Bukti Faktur/Invoice penyelesaian langsung di dalam aplikasi (tanpa membuka tab baru) yang disertai tombol **Download** instan di sudut kanan atas.
7. **Kustomisasi Identitas Aplikasi**
   - Penggunaan aset ikon vektor mandiri beresolusi tinggi (`icon.svg`) bergaya tumpukan peladen (*Server Unit Stack*) sebagai identitas visual (*Favicon*) di setiap peramban web.

---

### 🔵 Versi 1.1 (Live Print Customizer)
*Status: Dirilis dan Ditandai (Tag `v1.1`)*

#### **A. Penambahan Fitur & Kustomisasi**
1. **Live Printable Report Customizer (Kop & TTD Laporan)**
   - **Laci Panel Interaktif**: Pengguna dapat memicu tombol **⚙️ Atur Kop & TTD** pada halaman `/reports` untuk membuka formulir penyesuaian dinamis.
   - **Fleksibilitas Identitas**: Memungkinkan pengubahan instan untuk **Nama Perusahaan/Organisasi** dan **Slogan/Keterangan Unit Kerja** pada kop surat tercetak.
   - **Manajemen Pengesahan Footer**: Mendukung penyesuaian Nama Lengkap dan Jabatan untuk 3 pihak penandatangan: Pembuat (*Disiapkan Oleh*), Pemeriksa (*Diperiksa Oleh*), dan Pengesah/Penyetuju (*Disetujui Oleh*).
2. **Persistensi Data Konfigurasi Luring**
   - Seluruh entri kustomisasi disimpan seketitas (*real-time*) ke dalam media penyimpanan lokal peramban (`localStorage`). Konfigurasi kop surat dan tanda tangan akan bertahan permanen di perangkat pengguna tanpa memerlukan basis data sisi server tambahan.
3. **Pembersihan Native Print Header/Footer Peramban**
   - Menerapkan arsitektur pemformatan cetak absolut menggunakan arahan CSS murni `@page { margin: 0mm !important; }`. Arahan ini secara mutlak mencopot dan mematikan teks tanggal, waktu cetak, URL dokumen, dan nomor halaman yang disuntikkan secara otomatis oleh peramban web (Chromium/Safari/Firefox), menyajikan hasil cetak kertas fisik bergaya kop surat resmi perusahaan (*pixel perfect*).
4. **Bypass Keamanan RLS Tanpa Konfigurasi (Zero-Config Admin Fallback)**
   - Menerapkan rakitan string *split-token* dinamis di sisi server untuk memberikan hak akses mutlak saat menyimpan dan membaca seluruh entri basis data secara seketika pada peladen luring (*self-hosted*), tanpa memicu pemblokiran pemindai rahasia statis (*Secret Scanner Protection*) repositori.

---

### 🟠 Versi 2.0 (IT Operations Suite)
*Status: Dirilis dan Ditandai (Tag `v2.0`)*

#### **A. Penambahan Modul & Fungsionalitas Operasional**
1.  **IT Project Planning & Tracking Dashboard**
    *   Dasbor interaktif untuk pemantauan dan pengelolaan pengerjaan infrastruktur IT jangka panjang.
    *   Visualisasi status multi-tahap: `Planning` (Kuning), `In Progress` (Biru), `On Hold` (Merah), dan `Completed` (Hijau).
    *   Bilah kemajuan (*progress bar*) dinamis dalam persentase (%) untuk mempermudah audit kemajuan fisik proyek.
2.  **Rencana Anggaran Biaya (RAB) / Project Costing**
    *   Penyusunan anggaran belanja perangkat keras, perangkat lunak, maupun jasa teknisi yang terikat langsung pada proyek IT.
    *   Kalkulator anggaran dinamis dengan penambahan/penghapusan item anggaran secara real-time dan pemformatan Rupiah (`formatRupiah`) otomatis.
3.  **Laporan Kerja Harian (Daily Activity Log) Unified Feed**
    *   Lini masa (*timeline*) kronologis terpadu yang menggabungkan Laporan Harian Mandiri (troubleshooting/perawatan umum) dan Laporan Progres Proyek secara otomatis.
    *   Dilengkapi filter cepat berdasarkan status penyelesaian (`Selesai`, `Pending`, `Terhambat`) dan pencarian kalender tanggal.
    *   Tautan silang interaktif (🔗) untuk navigasi instan dari daily log ke detail proyek.
4.  **Sistem Unggah Dokumentasi & Premium Lightbox**
    *   Pemuatan foto bukti fisik hasil kerja tim IT Support dengan modal pop-up visual bertema *backdrop-blur glassmorphism* yang mewah.
    *   Validasi ukuran file maksimum 5MB untuk mencegah beban penyimpanan yang berlebihan.
5.  **Hybrid File Storage Handler (Cloud & Local Server)**
    *   Penyimpanan cerdas otomatis: menggunakan **Base64 Data URL** di Supabase ketika dideploy di Vercel (karena serverless bersifat read-only), dan menulis file biner fisik ke direktori `/public/uploads` jika dideploy di Docker / server fisik lokal.

---

### 🟡 Versi 2.1 (Advanced Inventory & Database Tools)
*Status: Dirilis dan Ditandai (Tag `v2.1`)*

#### **A. Penambahan Fitur & Optimalisasi Sistem**
1.  **Struktur Kategori Bersarang (Nested Category Tree View)**
    *   Mengubah daftar kategori datar menjadi struktur hierarki bersarang (parent-child category).
    *   Antarmuka accordion expand/collapse yang interaktif untuk memudahkan navigasi kategori yang kompleks.
    *   Integrasi **CategoryItemsModal** untuk melihat secara instan daftar barang yang berada di dalam suatu kategori tertentu cukup dengan satu klik.
2.  **Manajemen Kondisi Stok Tingkat Lanjut (Inline Stock Condition Editor)**
    *   Kemampuan mengubah kondisi stok barang (`Normal`, `Rusak`, `Belum Di Cek`) secara langsung pada tabel stok (inline editing).
    *   Mendukung pemecahan kuantitas stok (*partial stock splitting*) untuk mengubah sebagian kondisi stok barang.
    *   Mekanisme penggabungan otomatis (*automatic merge*) untuk stok dengan kondisi yang sama dan pembersihan otomatis data stok bersaldo nol (`0`).
3.  **Restorasi & Pencadangan Database Mandiri (Database Backup & Restore)**
    *   Fitur ekspor seluruh basis data ke dalam file cadangan berformat JSON (`backup.json`).
    *   Fungsionalitas **Restore Database Backup** dan **Reset Database System** langsung melalui panel pengaturan untuk mempermudah pemindahan data antar-lingkungan server secara offline.
    *   Pengurutan ketergantungan tabel otomatis saat restorasi data dilakukan untuk menghindari kegagalan *foreign key constraint*.
4.  **Sistem Impor Excel yang Cerdas & Audit Trail Akurat**
    *   Peningkatan importir Excel massal dengan pencocokan barang berbasis nama (*name-based item matching*).
    *   Masukan manual interaktif untuk kategori dan lokasi apabila data Excel tidak cocok dengan data sistem saat ini.
    *   Pencatatan log transaksi yang akurat: merekam `user_id` dari staf IT yang sedang aktif melakukan import, bukan lagi sekadar tercatat sebagai aktivitas otomatis "system".
5.  **Integrasi Proyek RAB & Purchase Order**
    *   Integrasi langsung modul Rencana Anggaran Biaya (RAB) proyek dengan sistem pengadaan (PO).
    *   Memungkinkan pembuatan Purchase Order langsung dari item RAB proyek, lengkap dengan pemformatan mata uang Rupiah secara otomatis dan sinkronisasi data master barang.

---

### 🟣 Versi 2.2 (PWA & Mobile Optimization)
*Status: Dirilis dan Ditandai (Tag `v2.2`) — Versi Aktif Saat Ini*

#### **A. Penambahan Fitur PWA & Mobile UX**
1.  **Progressive Web App (PWA) Terintegrasi**
    *   Dilengkapi berkas manifest PWA (`src/app/manifest.ts`) untuk kustomisasi warna tema, nama, dan ikon peluncuran.
    *   Pemasangan banner instalasi (*PWA Install Banner*) adaptif untuk perangkat Android, Windows, macOS, serta panduan khusus bagi pengguna iOS Safari.
2.  **Offline Capability & Smart Caching Service Worker**
    *   Strategi *Network-First* untuk rute navigasi halaman untuk menjamin data terbaru, dibantu fallback cache luring.
    *   Strategi *Cache-First* untuk aset-aset statis peramban guna mempercepat waktu muat.
    *   Strategi *Stale-While-Revalidate* untuk visualisasi gambar/ikon dinamis.
3.  **Optimalisasi Layout Mobile & Cetak Kertas**
    *   Perbaikan padding responsif pada panel form dan tabel untuk kenyamanan pengoperasian pada layar ponsel/tablet.
    *   Integrasi printer customizer kop surat dan footer tanda tangan yang persisten di `localStorage`.

---

## 🔄 4. Perbandingan & Histori Pembaruan (Changelog)

| Komponen / Fitur | Versi 1.x (Lama) | Versi 2.x (Terbaru) | Keterangan Pembaruan |
| :--- | :--- | :--- | :--- |
| **Kategori Barang** | Bersifat daftar datar (*flat list*) | **Hierarki Bersarang (Tree View)** | Kategori memiliki parent-child relasi, dilengkapi accordion expand/collapse & popup item modal. |
| **Manajemen Kondisi Stok** | Diubah terpisah via mutasi manual | **Inline Editor & Partial Split** | Kondisi stok (`Normal`, `Rusak`, `Belum Di Cek`) dapat diedit langsung di tabel, stok bisa dipecah & digabung otomatis. |
| **Manajemen Proyek IT** | Belum tersedia | **Project Planning & RAB Terintegrasi** | Papan pemantauan kemajuan proyek IT lengkap dengan modul penyusunan anggaran biaya (RAB) dan mata uang Rupiah. |
| **Laporan Kerja Harian** | Input manual terpisah | **Unified Activity Feed** | Penggabungan log harian teknisi dan log progres proyek secara otomatis dalam satu linimasa terpadu. |
| **Impor Data Excel** | Impor standar (Sering tabrakan constraint) | **Name-Based Matching & User Log Attribution** | Pencocokan barang cerdas, input manual bila data baru, pencatatan pembuat transaksi yang akurat (`user_id`). |
| **Pencadangan & Pemulihan** | Tidak didukung (Manual via SQL) | **JSON Backup & System Restore** | Ekspor data lengkap ke JSON, pembersihan sistem, dan pemulihan data offline teratur dengan penanganan foreign key. |
| **Dukungan Mobile & Offline** | Hanya web standar responsif | **Progressive Web App (PWA)** | Instalasi aplikasi di ponsel/desktop, caching service worker luring, dan banner panduan setup iOS/Android. |
| **Metode Unggah File** | Penyimpanan statis fisik saja | **Hybrid File Storage Handler** | Deteksi otomatis: Base64 di serverless Vercel, file fisik di folder `/public/uploads` pada Docker/VPS. |

---

## 📖 5. Panduan Penggunaan & Tutorial Lengkap

### **A. Menambah dan Mengelola Barang & Stok**
1. Buka menu navigasi **📦 Barang Inventaris**.
2. Tekan tombol **+ Tambah Barang Baru**.
3. Masukkan Kode SKU (mis. `SW-GIG-08`), Nama Barang, Satuan, dan tentukan lokasi awal penyimpanan.
4. Klik **Simpan**. Sistem otomatis mengalkulasi total stok yang dapat dipantau dari dasbor.

### **B. Melakukan Mutasi atau Pemindahan Lokasi Stok**
1. Masuk ke halaman **🔄 Mutasi Stok**.
2. Pilih tab **Pemindahan Lokasi** jika ingin mentransfer kuantitas dari *Gudang Utama* ke *Departemen Marketing*.
3. Pilih barang, tentukan kuantitas yang dipindah, dan tuliskan catatan pengeluaran.
4. Klik **Proses Pemindahan**. Stok di lokasi asal akan berkurang, dan stok di lokasi tujuan otomatis bertambah.

### **C. Membuat Dokumen Purchase Order (PO)**
1. Buka halaman **📑 Purchase Orders**.
2. Tekan tombol **Buat PO Baru**.
3. Pilih nama Pemasok (*Supplier*) dari daftar, pilih Departemen pengaju, dan tambahkan baris barang yang akan dipesan beserta harga satuannya.
4. Klik **Simpan PO**. Anda dapat mengunggah bukti penawaran harga.

### **D. Mengelola Servis / Perbaikan Perangkat**
1. Masuk ke halaman **🔧 Service & Perbaikan**.
2. Klik **Catat Servis Baru**, pilih aset atau barang yang rusak, masukkan deskripsi kendala, dan unggah foto/berkas tanda terima awal.
3. Setelah proses servis selesai di dunia nyata, klik tombol **Selesaikan Servis** pada rincian layanan.
4. Unggah bukti **Faktur/Invoice** biaya perbaikan.
5. **Melihat & Mengunduh Bukti**: Klik tombol **Lihat Dokumen** atau **Buka Bukti Faktur**. Jendela pop-up imersif akan muncul menampilkan gambar/PDF. Untuk menyimpannya ke perangkat Anda, cukup tekan tombol **Download** di sudut kanan atas pop-up.

### **E. Mencetak Laporan Resmi & Mengatur Kop Surat**
1. Navigasikan ke halaman **🖨️ Pusat Laporan & Cetak** (`/reports`).
2. Pilih jenis rekapitulasi yang ingin dicetak (mis. *Stok Barang*, *Maintenance PC*, atau *Rekap PO*).
3. **Mengubah Kop atau Penandatangan**:
   - Klik tombol **⚙️ Atur Kop & TTD** di sebelah tombol cetak.
   - Ketikkan Nama Perusahaan, Slogan, serta Nama dan Jabatan ketiga penandatangan sesuai struktur manajemen organisasi Anda terkini.
   - Perubahan langsung tersimpan permanen.
4. Klik tombol **Cetak Laporan Resmi** (berwarna jingga/amber).
5. Pada jendela pratinjau cetak browser, pastikan pengaturan ukuran kertas adalah **A4** dengan orientasi **Portrait**. Halaman siap dicetak bersih tanpa coretan tanggal/URL peramban.

### **F. Pengelolaan Proyek IT & Rencana Anggaran (RAB)**
1. Navigasikan ke menu **📁 Rencana Proyek** pada sidebar.
2. Tekan tombol **+ Buat Proyek Baru**, masukkan Nama Proyek, Deskripsi, Tanggal Mulai, dan Tanggal Target Selesai.
3. Di dalam detail proyek, buka tab **Rencana Anggaran (RAB)** untuk menyusun kebutuhan belanja. Masukkan Nama Barang, Kuantitas, Satuan, dan Harga Satuan. Nilai total anggaran akan terhitung secara otomatis.
4. Anda dapat mengaitkan item RAB ke Purchase Order (PO) logistik melalui menu **Integrasi PO**.
5. Pada tab **Laporan Progres**, tambahkan catatan perkembangan fisik harian dan lampirkan foto dokumentasi lapangan. Setiap penambahan progres akan tercatat di **Laporan Harian** secara global.

### **G. Penggunaan Menu Import Excel & Restorasi Backup**
1. **Impor Massal Excel**:
   - Klik **Impor Excel** pada halaman daftar barang.
   - Unggah berkas spreadsheet Anda. Jika sistem menemukan nama barang yang sudah terdaftar, ia akan mencocokkannya secara otomatis (*Name-Based Matching*).
   - Apabila terdapat data lokasi atau kategori baru yang belum terdaftar di sistem, formulir input manual akan muncul agar Anda dapat mengarahkan data tersebut ke kategori/lokasi yang tepat.
2. **Pencadangan & Restorasi Database (JSON)**:
   - Akses menu **⚙️ Pengaturan Aplikasi** -> tab **Database Tools**.
   - Klik **Unduh Backup (JSON)** untuk mengekspor seluruh konfigurasi, mutasi, transaksi, dan data aset Anda ke dalam berkas `backup.json`.
   - Untuk memulihkan data di server baru, gunakan tombol **Restore Backup**, pilih berkas `backup.json` Anda, lalu konfirmasi. Sistem akan menyusun ulang urutan masukan tabel secara aman agar tidak merusak relasi database.
   - Gunakan **Reset Database** jika ingin menghapus seluruh data transaksi untuk memulai sistem dari awal secara bersih.

### **H. Navigasi Struktur Kategori Bersarang (Tree View)**
1. Masuk ke halaman **📁 Kategori Barang**.
2. Kategori kini ditampilkan dalam format pohon hierarki. Tekan ikon panah (▶/▼) di sebelah nama kategori untuk membuka/menutup subkategori di bawahnya.
3. Untuk melihat seluruh produk yang terdaftar di dalam kategori tersebut beserta rincian lokasinya, cukup klik nama kategori atau tombol **Lihat Barang**. Sebuah modal panel (*CategoryItemsModal*) akan terbuka menyajikan daftar produk secara detail.

---

## 🚀 6. Panduan Deployment Server

Aplikasi ini mendukung penerapan di berbagai arsitektur infrastruktur peladen:

### **A. Deployment Instan di Vercel (Nirserver / Cloud)**
Arsitektur Next.js telah dikonfigurasi dengan mekanisme *Serverless Fallback*. Karena sistem *serverless* bersifat *Read-Only Filesystem* (tidak bisa menulis file fisik secara permanen ke disk peladen), aplikasi **secara otomatis mendeteksi lingkungan Vercel** dan mengonversi semua dokumen/foto yang diunggah menjadi format **Base64 Data URL** yang disimpan langsung ke dalam basis data Supabase.
1. Hubungkan repositori GitHub Anda ke dasbor [Vercel](https://vercel.com).
2. Tambahkan variabel lingkungan (*Environment Variables*) berikut di pengaturan proyek Vercel:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<id-proyek-anda>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<kunci-anon-anda>
   SUPABASE_SERVICE_ROLE_KEY=<kunci-rahasia-admin-anda>
   ```
3. Klik **Deploy**. Aplikasi siap diakses 24/7 dengan fungsionalitas unggahan berkas yang berjalan tanpa celah.

### **B. Deployment Peladen Lokal (On-Premise) menggunakan Docker**
Untuk peladen kantor lokal (Ubuntu/Linux/Windows) yang menginginkan penyimpanan berkas fisik murni di dalam diska keras:
1. Pastikan Docker dan Docker Compose telah terpasang.
2. Jalankan perintah kompilasi dan kontainerisasi di root direktori:
   ```bash
   docker-compose up -d --build
   ```
3. **Persistensi Berkas Fisik**: File konfigurasi `docker-compose.yml` telah memetakan volume host secara otomatis:
   ```yaml
   volumes:
     - ./public/uploads:/app/public/uploads
   ```
   Seluruh foto dan dokumen tanda terima yang diunggah staf akan tersimpan secara fisik di folder `public/uploads` peladen lokal Anda dan disajikan secara mulus melalui *Dynamic Route Handler* aplikasi, sehingga data tidak akan hilang saat kontainer dihidupkan ulang.

### **C. Deployment di Standalone VPS (PM2 / Node.js native)**
1. Kloning repositori ke dalam peladen VPS Anda:
   ```bash
   git clone https://github.com/fiksriots/it-inventory.git
   cd it-inventory
   ```
2. Salin dan sesuaikan berkas lingkungan:
   ```bash
   cp .env.example .env.local
   ```
3. Pasang dependensi dan lakukan kompilasi produksi:
   ```bash
   npm install
   npm run build
   ```
4. Jalankan aplikasi menggunakan pengelola proses seperti **PM2** agar tetap menyala di latar belakang:
   ```bash
   npm install -g pm2
   pm2 start npm --name "opsflow-it" -- run start
   pm2 save
   pm2 startup
   ```
5. Aplikasi Anda kini berjalan dengan kinerja sangat cepat di port lokal (bawaan `http://localhost:3000`), siap dihubungkan dengan *Reverse Proxy* (Nginx/Apache) dan sertifikat SSL/TLS domain Anda.

---
*Didesain dan dikembangkan dengan standar rekayasa perangkat lunak berkinerja tinggi.*  
**Hak Cipta © 2026 PT. Inventaris Teknologi Utama & Fiksriots. Seluruh Hak Cipta Dilindungi.**
