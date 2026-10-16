import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  htmlLearningPath,
  learningStorageKey,
  countCompleted,
  sanitizeCompleted,
} from "@/data/learning-path";
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
// Statistik & progres (dihitung dari sumber data tunggal Learning Path)
//

export type SkillProgress = {
  id: string;
  name: string;
  icon: "html" | "css" | "uiux" | "english";
  /** Persen 0–100, dibulatkan. */
  percent: number;
};

export type ProfileStats = {
  /** Total materi selesai di seluruh learning path yang aktif. */
  completedMaterials: number;
  /** Total materi pada semua learning path. */
  totalMaterials: number;
  /** Persen keseluruhan 0–100 (aman dari pembagian 0). */
  overallPercent: number;
  /** Progres per skill. */
  skills: SkillProgress[];
};

/**
 * Hitung statistik dari daftar materi selesai di AsyncStorage.
 * Saat ini hanya learning path HTML yang aktif di aplikasi (dipakai
 * bersama halaman Learning Path & Progress), jadi skill lain tampil 0%
 * tanpa dihitung sebagai skill aktif.
 */
export async function computeProfileStats(): Promise<ProfileStats> {
  const completedIds = await loadCompletedIds();
  const { materials } = htmlLearningPath;

  const completedMaterials = countCompleted(materials, completedIds);
  const totalMaterials = materials.length;
  const overallPercent =
    totalMaterials > 0
      ? Math.round((completedMaterials / totalMaterials) * 100)
      : 0;

  // Learning path yang datanya aktif dipakai di aplikasi saat ini.
  const paths = [htmlLearningPath];

  // Semua skill dari data aplikasi (urutan sama dengan Explore);
  // skill tanpa learning path menampilkan 0% dan tidak dihitung aktif.
  const skillRows: SkillProgress[] = skillsData.map((skill) => {
    const path = paths.find((item) => item.skillId === skill.id);
    const percent =
      path && path.materials.length > 0
        ? Math.round(
            (countCompleted(path.materials, completedIds) /
              path.materials.length) *
              100,
          )
        : 0;
    return {
      id: skill.id,
      name: skill.name,
      icon: skill.icon,
      percent,
    };
  });

  return {
    completedMaterials,
    totalMaterials,
    overallPercent,
    skills: skillRows,
  };
}

/** Jumlah skill aktif = skill dengan learning path yang bermaterial. */
export function countActiveSkills(): number {
  const paths = [htmlLearningPath];
  return paths.filter((path) => path.materials.length > 0).length;
}

// Internal: baca id materi selesai, konsisten dengan learning-path.tsx.
async function loadCompletedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(learningStorageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sanitizeCompleted(
      htmlLearningPath.materials,
      parsed.filter((value): value is string => typeof value === "string"),
    );
  } catch {
    return [];
  }
}
