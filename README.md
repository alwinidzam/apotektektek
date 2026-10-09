# Apotek Kerso Waras 🌿

Sistem Informasi Manajemen Pelayanan Farmasi, Kasir POS Presisi, & Kepatuhan SatuSehat Kemenkes RI untuk **Apotek Kerso Waras** (Kedung, Jepara).

---

## 🌟 Fitur Utama

- **Kasir POS Presisi**:
  - Transaksi cepat dengan barcode scanner & pencarian instan (⌘K).
  - Manajemen pembayaran tunai, QRIS, EDC, & split bill.
  - Cetak struk kasir termal 80mm ESC/POS.
- **Manajemen Shift Kasir & Cash Drawer**:
  - Modal awal (opening float), pencatatan petty cash (paid-in / paid-out).
  - Blind cash count (hitung kas buta) & rekonsiliasi kas otomatis.
  - Penerbitan X-Report (interim reading) & Z-Report (penutupan permanen).
- **Inventori & FEFO (First-Expired, First-Out)**:
  - Pelacakan batch nomor, tanggal kedaluwarsa, dan radar peringatan ED.
  - Pemisahan data HPP (Harga Pokok Penjualan) rahasia berbasis RBAC.
- **Resep Racikan & Compounding**:
  - Kalkulasi dosis obat puyer/kapsul/sirup racikan farmasi.
  - Biaya embalase dan tuslah otomatis.
- **Kepatuhan Regulasi & SatuSehat Kemenkes RI**:
  - Integrasi SATUSEHAT Kemenkes & SIPNAP BPOM.
  - Pencatatan obat keras / prekursor / narkotika / psikotropika.
- **Dashboard Analitik & Laporan Keuangan Eksekutif (Owner)**:
  - Analisis omzet per shift, harian, mingguan, dan bulanan.
  - Laporan Laba Rugi (P&L) komprehensif, Gross Margin, & EBITDA.
  - Cetak Rekap Formal A4 siap tanda tangan berjenjang (Kasir, APJ, PSA).
- **Role-Based Access Control (RBAC) & Autentikasi**:
  - Super Admin, Owner (PSA), Apoteker (APJ), dan Kasir (Karyawan).
  - Keamanan audit log rekam aktivitas dan penguncian akun anti-brute force.
- **Apple Human Interface Guidelines (HIG)**:
  - Desain minimalis bersih (*macOS / iPadOS / iOS ergonomics*).
  - 100% responsif dengan zero horizontal overflow & zero scroll login interface.
  - Logo vektor SVG resolusi tak hingga (*infinite resolution*).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **State & Store**: [Zustand](https://github.com/pmndrs/zustand)
- **Database & Local Persistence**: [Dexie.js](https://dexie.org/) (IndexedDB) & [Firebase Firestore](https://firebase.google.com/)
- **Icons & Visuals**: [Lucide React](https://lucide.dev/) & Pure Vector SVG
- **Audio Feedback**: Web Audio API Sound Engine

---

## 🚀 Memulai (Getting Started)

### 1. Kloning Repositori
```bash
git clone https://github.com/alwinidzam/apotektektek.git
cd apotektektek
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.local.example` ke `.env.local`:
```bash
cp .env.local.example .env.local
```

Sesuaikan konfigurasi Firebase jika menggunakan live Firebase Console.

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## 📄 Lisensi
Hak Cipta © 2026 Apotek Kerso Waras (Kedung, Jepara). Seluruh hak cipta dilindungi undang-undang.
