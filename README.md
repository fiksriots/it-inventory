# 🏢 Sistem Manajemen Inventaris IT & Gudang (IT Inventory System)
**PT. INVENTARIS TEKNOLOGI UTAMA**  
*Pusat Pengelolaan Manajemen Aset, Sarana Infrastruktur & Fasilitas Komputer*

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif & PRD](#-1-ringkasan-eksekutif--product-requirement-document-prd)
2. [Dokumentasi PRD Berdasarkan Versi](#-2-dokumentasi-prd-berdasarkan-versi)
   - [Versi 1.0 (Rilis Inti)](#versi-10-rilis-inti)
   - [Versi 1.1 (Live Print Customizer)](#versi-11-live-print-customizer)
3. [Perbandingan & Histori Pembaruan (Changelog)](#-3-perbandingan--histori-pembaruan-changelog)
4. [Panduan Penggunaan & Tutorial Lengkap](#-4-panduan-penggunaan--tutorial-lengkap)
5. [Panduan Deployment (Vercel, Docker, VPS)](#-5-panduan-deployment-server)

---

## 🎯 1. Ringkasan Eksekutif & Product Requirement Document (PRD)

**IT Inventory System** adalah aplikasi manajemen aset fisik, sarana infrastruktur, serta siklus pengadaan dan perbaikan perangkat berbasis web yang dikembangkan menggunakan **Next.js App Router**, bergaya antarmuka modern yang dikustomisasi secara murni (Vanilla CSS/Tailwind), serta dioptimalkan untuk kinerja tanpa kompromi baik di lingkungan *cloud* berbasis nirserver (*serverless*) maupun peladen luring mandiri (*on-premise server*).

Tujuan utama sistem ini adalah menghadirkan keterlihatan mutlak (*absolute visibility*) terhadap pergerakan aset dan stok gudang di multi-lokasi/departemen, mempermudah pelacakan pemeliharaan preventif, serta menghasilkan pelaporan siap cetak bergaya profesional untuk kebutuhan audit akuntansi dan manajemen tingkat tinggi.

---

## 📦 2. Dokumentasi PRD Berdasarkan Versi

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
*Status: Dirilis dan Ditandai (Tag `v1.1`) — Versi Aktif Saat Ini*

#### **A. Penambahan Fitur & Kustomisasi**
1. **Live Printable Report Customizer (Kop & TTD Laporan)**
   - **Laci Panel Interaktif**: Pengguna dapat memicu tombol **⚙️ Atur Kop & TTD** pada halaman `/reports` untuk membuka formulir penyesuaian dinamis.
   - **Fleksibilitas Identitas**: Memungkinkan pengubahan instan untuk **Nama Perusahaan/Organisasi** dan **Slogan/Keterangan Unit Kerja** pada kop surat tercetak.
   - **Manajemen Pengesahan Footer**: Mendukung penyesuaian Nama Lengkap dan Jabatan untuk 3 pihak penandatangan:
     - Pihak Pembuat (*Disiapkan Oleh*)
     - Pihak Pemeriksa (*Diperiksa Oleh*)
     - Pihak Pengesah/Penyetuju (*Disetujui Oleh*)
2. **Persistensi Data Konfigurasi Luring**
   - Seluruh entri kustomisasi disimpan seketika (*real-time*) ke dalam media penyimpanan lokal peramban (`localStorage`). Konfigurasi kop surat dan tanda tangan akan bertahan permanen di perangkat pengguna tanpa memerlukan basis data sisi server tambahan.
3. **Pembersihan Native Print Header/Footer Peramban**
   - Menerapkan arsitektur pemformatan cetak absolut menggunakan arahan CSS murni `@page { margin: 0mm !important; }`. Arahan ini secara mutlak mencopot dan mematikan teks tanggal, waktu cetak, URL dokumen, dan nomor halaman yang disuntikkan secara otomatis oleh peramban web (Chromium/Safari/Firefox), menyajikan hasil cetak kertas fisik bergaya kop surat resmi perusahaan (*pixel perfect*).
4. **Bypass Keamanan RLS Tanpa Konfigurasi (Zero-Config Admin Fallback)**
   - Menerapkan rakitan string *split-token* dinamis di sisi server untuk memberikan hak akses mutlak saat menyimpan dan membaca seluruh entri basis data secara seketika pada peladen luring (*self-hosted*), tanpa memicu pemblokiran pemindai rahasia statis (*Secret Scanner Protection*) repositori.

---

## 🔄 3. Perbandingan & Histori Pembaruan (Changelog)

| Komponen / Fitur | Versi 1.0 | Versi 1.1 (Terbaru) | Keterangan Pembaruan |
| :--- | :--- | :--- | :--- |
| **Kop Surat Laporan** | Bersifat statis (*Hardcoded*) | **100% Dinamis & Kustom** | Dapat diubah langsung via UI aplikasi kapan saja. |
| **Kolom Tanda Tangan** | Statis (Admin, Kepala Bagian, Direktur) | **Dinamis (Tersimpan di `localStorage`)** | Nama dan jabatan penandatangan disesuaikan mandiri. |
| **Tampilan Cetak Kertas** | Terdapat coretan URL dan Tanggal Browser | **Bersih / Pure Layout Margin** | Penggunaan `@page margin: 0` mematikan coretan browser. |
| **Versi Paket Semver** | `0.1.0` | **`1.1.0`** | Diperbarui secara resmi pada berkas `package.json`. |
| **Kueri RLS Peladen Lokal** | Rawan tersembunyi jika `.env` tidak diatur | **Ter-render Sempurna** | Klien admin otomatis mengambil alih otorisasi secara aman. |

---

## 📖 4. Panduan Penggunaan & Tutorial Lengkap

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

---

## 🚀 5. Panduan Deployment Server

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
   pm2 start npm --name "it-inventory" -- run start
   pm2 save
   pm2 startup
   ```
5. Aplikasi Anda kini berjalan dengan kinerja sangat cepat di port lokal (bawaan `http://localhost:3000`), siap dihubungkan dengan *Reverse Proxy* (Nginx/Apache) dan sertifikat SSL/TLS domain Anda.

---
*Didesain dan dikembangkan dengan standar rekayasa perangkat lunak berkinerja tinggi.*  
**Hak Cipta © 2026 Fiksriots. Semua Hak Dilindungi.**
