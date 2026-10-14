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
} as const;

export type AppColor = keyof typeof colors;
