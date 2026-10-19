import AsyncStorage from "@react-native-async-storage/async-storage";
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

//
// Kunci penyimpanan
//

/** Username yang diedit via halaman pengaturan. */
export const usernameStorageKey = "@skill-track/profile/username";

/** Username bawaan, dipakai untuk avatar, nama di header, dan default input. */
export const defaultUsername = "Agus ariep yudhi Hidayat";

/** Label role pengguna di bawah nama. */
export const userRole = "Pelajar";

/** Inisial yang ditampilkan pada avatar lingkaran. */
export const avatarInitials = "AS";

/**
 * Riwayat aktivitas belajar: daftar timestamp (ISO) dari setiap
 * penyelesaian materi. Tambah/jam tetap tersimpan setelah app ditutup.
 */
const activityKey = "@skill-track/profile/activity";

//
// Aktivitas belajar
//

/** Catat satu aktivitas (penyelesaian materi) ke AsyncStorage. Idempotent per id. */
export async function recordActivity(materialId: string): Promise<void> {
  try {
    const stored = await readActivityTimestamps();
    // Idempoten: aktivitas untuk materi yang sama tidak dicatat dua kali
    // (mencegah grafik mendadak naik dua kali untuk satu materi yang sama).
    if (stored.some((entry) => entry.materialId === materialId)) {
      return;
    }
    const next = [...stored, { timestamp: Date.now(), materialId }];
    await AsyncStorage.setItem(activityKey, JSON.stringify(next));
  } catch {
    // Gagal menyimpan aktivitas tidak boleh menggagalkan penyelesaian materi.
  }
}

/** Baca semua entry aktivitas dari AsyncStorage. Gagal = kosong. */
export async function readActivityTimestamps(): Promise<
  { timestamp: number; materialId: string }[]
> {
  try {
    const raw = await AsyncStorage.getItem(activityKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (entry): entry is { timestamp: number; materialId: string } =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { timestamp?: unknown }).timestamp === "number" &&
          typeof (entry as { materialId?: unknown }).materialId === "string",
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
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
// Username
//

/** Baca username tersimpan; gagal/kosong = default. */
export async function loadUsername(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(usernameStorageKey);
    const trimmed = stored?.trim();
    return trimmed ? trimmed : defaultUsername;
  } catch {
    return defaultUsername;
  }
}

/** Simpan username (trim); string kosong diabaikan. */
export async function saveUsername(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  await AsyncStorage.setItem(usernameStorageKey, trimmed);
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
