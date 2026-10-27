# SkillTrack — Peta Struktur Project

> Dokumentasi ini berdasarkan **struktur aktual setelah refactor komponen**
> (versi `expo ~57`, Expo Router, TypeScript path alias `@/* → src/*`).
> Semua path yang dicantumkan benar-benar ada di project ini.

## 1. Struktur folder & fungsi setiap folder

```
skill-track/
├── app.json                  # Konfigurasi Expo (nama app, splash, ikon, scheme)
├── package.json              # Entry point: expo-router/entry; dependency & scripts
├── tsconfig.json             # Konfigurasi TypeScript + path alias "@/*" → "src/*"
├── eslint.config.js          # Aturan lint (eslint-config-expo)
├── expo-env.d.ts             # Tipe yang dihasilkan Expo (di-generate, jangan diubah manual)
├── PROJECT_STRUCTURE.md      # Dokumen ini
├── assets/                   # Aset statis: ikon app, splash, gambar
│   └── images/
└── src/
    ├── app/                        # ROUTING & SCREENS (Expo Router)
    │   ├── _layout.tsx             # Root Stack + gerbang autentikasi (Stack.Protected)
    │   ├── (tabs)/
    │   │   ├── _layout.tsx         # Tab navigator: Home, Explore, Progress, Profil
    │   │   ├── index.tsx           # Tab Home
    │   │   ├── explore.tsx         # Tab Explore
    │   │   ├── progress.tsx        # Tab Progress
    │   │   ├── profil.tsx          # Tab Profil
    │   │   └── learning-path.tsx   # Learning Path (tampil sebagai tab, di-inject)
    │   ├── login.tsx               # Halaman login
    │   ├── register.tsx            # Halaman register
    │   ├── settings.tsx            # Pengaturan (edit profil, ganti password, logout)
    │   ├── skill-detail.tsx        # Detail skill (dari Explore)
    │   ├── material-detail.tsx     # Detail materi (skill non-Bahasa Inggris)
    │   └── activity-history.tsx    # Riwayat aktivitas belajar
    ├── components/                 # Komponen UI, dikelompokkan per peran/fitur:
    │   ├── ui/                     # — UI generik reusable (lintas fitur)
    │   │   ├── themed-text.tsx          # Komponen Text standar (variant + tema)
    │   │   ├── icons.tsx                # Semua ikon SVG/SF kustom
    │   │   ├── subject-icon.tsx         # Ikon per-skill (html/css/uiux/english)
    │   │   ├── progress-bar.tsx         # Bar progres
    │   │   ├── search-bar.tsx           # Kolom pencarian
    │   │   ├── category-filter.tsx      # Filter kategori
    │   │   └── skill-card.tsx           # Kartu skill
    │   ├── auth/                   # — Komponen khusus fitur autentikasi
    │   │   ├── auth-input.tsx           # Input form login/register
    │   │   ├── auth-splash.tsx          # Splash animasi saat membaca sesi
    │   │   └── skilltrack-logo.tsx      # Logo splash/login/register
    │   ├── profile/                # — Komponen khusus profil/pengaturan
    │   │   ├── profile-header.tsx       # Header profil (avatar + nama + roda gigi)
    │   │   └── change-password-modal.tsx  # Modal ganti password (Settings)
    │   └── learning-path/          # — Komponen khusus fitur learning path
    │       └── english-material-detail.tsx # UI detail materi Bahasa Inggris
    ├── data/                       # LOGIKA DATA & STORAGE ("services" project ini)
    │   ├── auth.ts                 # Akun, sesi, login/register/logout/change-password
    │   ├── skills.ts               # Data master skill (kategori, level, ikon)
    │   ├── learning-path.ts        # Data materi + fungsi status materi (locked/active/done)
    │   ├── progress-store.ts       # State progress belajar (in-memory sesi)
    │   ├── profile.ts              # Statistik profil + riwayat aktivitas
    │   └── profile-display.ts      # Helper murni: inisial avatar & subtitle
    ├── hooks/                      # Custom hooks (jembatan store ↔ React)
    │   ├── use-auth-state.ts       # Berlangganan sesi login
    │   └── use-progress-state.ts   # Berlangganan state progress
    └── constants/
        └── theme.ts                # Skema warna & konfigurasi UI bersama
```

## 2. Tabel lokasi file per fitur (hasil audit)

| Fitur | Lokasi file aktual | Fungsi |
|---|---|---|
| Home | `src/app/(tabs)/index.tsx`, `src/components/ui/progress-bar.tsx`, `src/components/ui/subject-icon.tsx`, `src/components/profile/profile-header.tsx` | Halaman utama: header + ringkasan progress & skill dimulai |
| Explore | `src/app/(tabs)/explore.tsx`, `src/components/ui/search-bar.tsx`, `src/components/ui/category-filter.tsx`, `src/components/ui/skill-card.tsx`, `src/data/skills.ts` | Eksplorasi skill: daftar, filter kategori, mulai skill |
| Learning Path | `src/app/(tabs)/learning-path.tsx`, `src/app/material-detail.tsx`, `src/components/learning-path/english-material-detail.tsx`, `src/data/learning-path.ts` | Daftar & detail materi, status materi (selesai/aktif/terkunci), tandai selesai |
| Progress | `src/app/(tabs)/progress.tsx`, `src/data/progress-store.ts`, `src/hooks/use-progress-state.ts` | Statistik belajar per skill |
| Profile | `src/app/(tabs)/profil.tsx`, `src/components/profile/profile-header.tsx`, `src/data/profile.ts`, `src/data/profile-display.ts`, `src/app/settings.tsx`, `src/app/activity-history.tsx` | Profil pengguna, statistik, aktivitas mingguan, pengaturan, logout |
| Login/Register | `src/app/login.tsx`, `src/app/register.tsx`, `src/components/auth/auth-input.tsx`, `src/components/auth/skilltrack-logo.tsx`, `src/data/auth.ts`, `src/hooks/use-auth-state.ts` | Autentikasi lokal (AsyncStorage; password di-hash SHA-256 + salt) |
| Navigasi | `src/app/_layout.tsx` (root), `src/app/(tabs)/_layout.tsx` (tab) | Perpindahan halaman + guard login/logout |

### File konfigurasi & entry point

- **Entry point**: `package.json` → `main: "expo-router/entry"` → membaca semua route dari `src/app/`.
- **Konfigurasi**: `app.json`, `tsconfig.json`, `eslint.config.js`, `expo-env.d.ts`.
- **Tema/warna**: `src/constants/theme.ts` (`colors`, `learningColors`, dll).

## 3. Hubungan screen ↔ components ↔ hooks ↔ data

```
Screen (src/app/**)          ──── pakai ──▶ components (src/components/ui|auth|profile|learning-path)
      │
      ──── baca state ──▶ hooks (src/hooks/**)
                              │
                              ▼ berlangganan
                          data store (src/data/**)
                              │
        ┌─────────────────────┼──────────────────────┐
   auth.ts            progress-store.ts        learning-path.ts
 (sesi + akun,      (progress in-memory       (data materi +
  AsyncStorage)      + subscribeSession)       perhitungan status)
        │                                              ▲
        └── subscribeSession mem-broadcast ganti akun ──┘
```

- **Aliran tulis progress**: user menyelesaikan materi di `material-detail.tsx`
  (atau `components/learning-path/english-material-detail.tsx` untuk materi
  English) → `progress-store.ts` (`markCompleted`) + `profile.ts`
  (`recordActivity`) → semua screen yang pakai `useProgressState`
  otomatis ikut berubah.
- **Aliran sesi**: `data/auth.ts` menyimpan sesi ke AsyncStorage →
  `hooks/use-auth-state.ts` (`subscribeSession`) → `app/_layout.tsx`
  berganti antara group login (guard `!session`) dan group app
  (guard `session`) → riwayat halaman dibuang otomatis.
- **Perhitungan persentase**: TIDAK pernah disimpan — selalu dihitung
  dari materi selesai oleh `data/learning-path.ts` (`computeProgress`) dan
  `data/progress-store.ts` (`computeSummary`).
- **Entri Learning Path**: selalu melalui
  `router.push({ pathname: "/learning-path", params: { skillId } })`.

## 4. Panduan debugging — urutan pemeriksaan file

### A. UI halaman Profil berantakan / elemen tidak sejajar
1. `src/app/(tabs)/profil.tsx` — bagian "Kartu Progress Keseluruhan" (style `statList`, `statRow`, `statInfo`, `statIconBox`).
2. `src/components/profile/profile-header.tsx` — jika masalahnya di header nama/avatar.
3. `src/constants/theme.ts` — verifikasi warna/typografi yang dipakai (baca saja, jangan ubah nilai temanya).

### B. Ikon atau tombol tidak tampil / tidak sejajar
1. `src/components/ui/icons.tsx` — hampir semua ikon di sini; cek properti dimensi.
2. `src/components/ui/subject-icon.tsx` — ikon per-skill.
3. Halaman yang menampilkannya — cek style `gap`, `alignItems`, `justifyContent`.

### C. Tombol atau interaksi tidak berfungsi
1. Halaman tempat tombol tersebut — cek handler dan panggilan `router.push`.
2. `src/app/_layout.tsx` — apakah screen tersebut terdaftar dalam group `Stack.Protected` dan guard-nya sesuai.
3. `src/app/(tabs)/_layout.tsx` — apakah tab valid.

### D. Navigasi salah / tombol back bermasalah
1. `src/app/_layout.tsx` — root Stack, guard, alur auth.
2. `src/app/(tabs)/_layout.tsx` — susunan tab, ikon highlight.
3. Halaman asal — param `from`, `skillId` yang dikirim `router.push`.

### E. Progress tidak diperbarui / tidak tersimpan
1. `src/app/material-detail.tsx` atau `src/components/learning-path/english-material-detail.tsx` — cek pemanggilan `markCompleted` / `recordActivity`.
2. `src/data/progress-store.ts` — penyimpanan in-memory + fungsi `markCompleted`.
3. `src/hooks/use-progress-state.ts` — berlangganan perubahan store.
4. `src/data/profile.ts` — khusus aktivitas mingguan (`recordActivity`).

> Catatan penting: progress sengaja **in-memory sesi** (kembali ke awal saat
> reload) — bukan bug. Lihat komentar di `src/data/progress-store.ts`.

### F. Materi terkunci / terbuka secara tidak benar
1. `src/data/learning-path.ts` — fungsi status materi (`locked`, `active`, `completed`) dan `sanitizeCompleted`.
2. `src/data/progress-store.ts` — daftar `started` & `completed` yang menentukan status.
3. `src/app/(tabs)/learning-path.tsx` — cara memakai status.

### G. Login atau register gagal
1. `src/data/auth.ts` — validasi, pembuatan akun (`register`), verifikasi password (`login`).
2. `src/app/login.tsx` / `src/app/register.tsx` — cara form memanggil store.
3. `src/hooks/use-auth-state.ts` — penyedia state ke halaman dan splash gate.
4. `src/components/auth/auth-input.tsx` — hanya jika masalah pada field input.

### H. TypeScript atau import error
1. `tsconfig.json` — cek alias `@/*` → `src/*`.
2. File yang error — pastikan path mengikuti tabel di atas.
3. Jalankan `npx tsc --noEmit` untuk melihat seluruh error.

### I. Splash / startup macet
1. `src/app/_layout.tsx` — sinkronisasi splash native + animasi.
2. `src/components/auth/auth-splash.tsx` — animasi splash.
3. `src/hooks/use-auth-state.ts` — pembacaan sesi awal (`ready`).

## 5. File yang sengaja TIDAK diubah

- `app.json`, `package.json`, `tsconfig.json`, `eslint.config.js` — konfigurasi &
  dependency sudah benar; mengubahnya berisiko tanpa kebutuhan nyata.
- `src/data/*` — logika bisnis berjalan sesuai desain; progress in-memory adalah
  keputusan yang terdokumentasi di komentar file, bukan bug.
- Nama & isi route di `src/app/` tidak diubah — struktur sudah konsisten dengan
  Expo Router dan mengubah nama route berisiko mematahkan navigasi.

## 6. Folder yang bukan bagian aplikasi

- `.tmp-lp-test/` — folder sementara berisi skrip debugging/E2E mandiri
  (punya `package.json` sendiri, di luar build aplikasi). Sudah ditambahkan
  ke `.gitignore`. **Tidak dipindah atau dihapus** sesuai aturan refactor.
