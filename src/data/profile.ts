// Catatan penyimpanan:
// - Data akun & profil (nama, username, email, password) → AsyncStorage
//   per akun melalui src/data/auth.ts. Sumber tunggal profil adalah record
//   akun yang sedang login — TIDAK ada nama default hardcoded untuk
//   semua akun.
// - Progress & aktivitas belajar → in-memory sesi (kembali ke awal saat
//   reload) dan otomatis dibersihkan saat akun berganti supaya pengguna
//   tidak melihat data milik pengguna lain.
import { subscribeSession } from "@/data/auth";
import {
  computeProgress,
  getLearningPath,
} from "@/data/learning-path";
import {
  computeSummary,
  loadProgress,
  startedPaths,
  type ProgressState,
} from "@/data/progress-store";
import { skillsData } from "@/data/skills";

// Helper tampilan profil (inisial avatar & subtitle) hidup di modul
// terpisah tanpa dependensi agar bisa diuji sendiri.
export { initialsFromName, profileSubtitle } from "@/data/profile-display";

/**
 * Riwayat aktivitas belajar: daftar timestamp dari setiap penyelesaian
 * materi SELAMA SESI INI. Disimpan di memori (tanpa AsyncStorage), jadi
 * hilang ketika aplikasi di-reload — konsisten dengan progress sesi.
 */
let sessionActivity: { timestamp: number; materialId: string }[] = [];

// Isolasi per akun: saat akun yang login berganti (login/logout), riwayat
// aktivitas sesi dibuang agar pengguna baru tidak melihat aktivitas
// pengguna sebelumnya.
let activityOwner: string | null = null;
subscribeSession((session) => {
  const owner = session?.username ?? null;
  if (owner !== activityOwner) {
    activityOwner = owner;
    sessionActivity = [];
  }
});

//
// Aktivitas belajar (sesi)
//

/** Catat satu aktivitas (penyelesaian materi) ke memori. Idempotent per id. */
export async function recordActivity(materialId: string): Promise<void> {
  // Idempoten: aktivitas untuk materi yang sama tidak dicatat dua kali
  // (mencegah grafik mendadak naik dua kali untuk satu materi yang sama).
  if (sessionActivity.some((entry) => entry.materialId === materialId)) {
    return;
  }
  sessionActivity = [
    ...sessionActivity,
    { timestamp: Date.now(), materialId },
  ];
}

/** Baca semua entry aktivitas sesi ini (terurut waktu naik). */
export async function readActivityTimestamps(): Promise<
  { timestamp: number; materialId: string }[]
> {
  return [...sessionActivity].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Kelompokkan aktivitas per hari LOCAL selama 7 hari terakhir
 * (6 hari lalu + hari ini). Hari tanpa aktivitas tetap muncul (0).
 */
export function buildWeeklyActivity(
  entries: readonly { timestamp: number; materialId: string }[],
  now: Date = new Date(),
): { label: string; count: number }[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dayKeys = entries.map((entry) => {
    const date = new Date(entry.timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  });
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    const key = day.getTime();
    return { label: dayLabels[day.getDay()], count: dayKeys.filter((k) => k === key).length };
  });
}

/** Format tanggal aktivitas menjadi label "Senin, 16 Okt 2026" lokal. */
export function formatActivityDate(target: Date): string {
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const day = target.getDate();
  const month = months[target.getMonth()];
  const year = target.getFullYear();
  return `${dayNames[target.getDay()]}, ${day} ${month} ${year}`;
}

//
// Statistik & progres (dihitung dari sumber data tunggal progress-store)
//

export type SkillProgress = {
  id: string;
  name: string;
  icon: "html" | "css" | "uiux" | "english";
  /** Persen 0–100, dibulatkan. */
  percent: number;
};

export type ProfileStats = {
  /** Total materi selesai pada skill yang sudah dimulai. */
  completedMaterials: number;
  /** Total materi pada skill yang sudah dimulai. */
  totalMaterials: number;
  /** Persen keseluruhan 0–100 (aman dari pembagian 0). */
  overallPercent: number;
  /** Progres skill yang sudah dimulai saja (bukan seluruh katalog). */
  skills: SkillProgress[];
  /** Jumlah skill aktif = skill yang sudah dimulai. */
  activeSkills: number;
};

/**
 * Hitung statistik dari progress store tunggal.
 * Skill yang belum dimulai tidak dihitung sebagai skill aktif dan
 * tidak masuk daftar; progress keseluruhan hanya dari skill aktif.
 */
export async function computeProfileStats(): Promise<ProfileStats> {
  const state = await loadProgress();
  const paths = startedPaths(state);
  const summary = computeSummary(state);

  const skillRows: SkillProgress[] = paths.map((path) => ({
    id: path.skillId,
    name: path.skillName,
    icon: (skillsData.find((skill) => skill.id === path.skillId)?.icon ??
      path.icon) as SkillProgress["icon"],
    percent: computeProgress(path.materials, state.completed),
  }));

  return {
    completedMaterials: summary.completedMaterials,
    totalMaterials: summary.totalMaterials,
    overallPercent: summary.overallPercent,
    skills: skillRows,
    activeSkills: paths.length,
  };
}

/** Baca state progres (wrapper agar halaman Profil tidak impor store langsung). */
export async function readProgressState(): Promise<ProgressState> {
  return loadProgress();
}

/**
 * Jumlah skill aktif = skill yang benar-benar sudah dimulai pengguna
 * (bukan jumlah seluruh learning path).
 */
export function countActiveSkills(state: ProgressState): number {
  return startedPaths(state).length;
}

export { getLearningPath };
