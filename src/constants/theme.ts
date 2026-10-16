/**
 * Palet warna Skill-Track — disesuaikan dengan desain referensi dashboard.
 */
export const colors = {
  /** Background utama dark navy */
  background: "#071525",
  /** Surface kartu */
  card: "#14263B",
  /** Border halus kartu */
  border: "#243E5B",
  /** Biru utama (aksi & status aktif) */
  primary: "#2855F4",
  /** Turquoise untuk progress fill */
  turquoise: "#2DD4BF",
  /** Teks utama putih kebiruan */
  text: "#EFF6FF",
  /** Teks sekunder biru keabu-abuan */
  textSecondary: "#8FA3BD",
  /** Lapisan biru di atas kartu (ikon & track) */
  blueLayer: "#1F3454",
  /** Warna ikon HTML */
  html: "#E44D26",
  /** Warna ikon CSS */
  css: "#1572B6",
  /** Warna ikon UI/UX */
  uiux: "#8B5CF6",
  /** Warna ikon English */
  english: "#22C55E",
  /** Search bar di halaman Explore */
  searchBg: "#1B2F49",
  /** Biru filter aktif di halaman Explore */
  filterActive: "#3568FF",
  /** Filter aktif di halaman Explore */
  filterInactive: "#0B1D31",
  /** Badge level (Pemula) — teal gelap */
  levelBadge: "#123B34",
  /** Teks badge level */
  levelText: "#2DD4BF",
  /** Warna kuning ikon bintang statistik "Skill Aktif" di Profil */
  star: "#FACC15",
  /** Warna buku ikon statistik "Materi Selesai" di Profil */
  statBook: "#3568FF",
} as const;

/**
 * Palet warna khusus halaman Learning Path (Detail Skill)
 * sesuai screenshot referensi (lebih terang dari palet dashboard).
 */
export const learningColors = {
  /** Biru utama tombol aksi & materi aktif */
  primary: "#3568FF",
  /** Hijau progress & status materi selesai */
  success: "#35D9AD",
  /** Background baris materi yang sedang aktif */
  cardActive: "#1D3557",
  /** Teks utama */
  text: "#F5F7FF",
  /** Teks sekunder */
  textSecondary: "#9EB2CC",
  /** Lingkaran materi terkunci */
  lockedCircle: "#3E5570",
  /** Angka pada lingkaran materi terkunci */
  lockedText: "#A9BDD6",
  /** Garis timeline menuju materi terkunci */
  lockedLine: "#2C4159",
  /** Background badge level hijau */
  badgeBg: "#157F5C",
  /** Teks badge level hijau */
  badgeText: "#EFFFF8",
} as const;

export type AppColor = keyof typeof colors;
