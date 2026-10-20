/**
 * Progress belajar disimpan HANYA di memori sesi (in-memory), tanpa
 * AsyncStorage / database. Ketika aplikasi di-refresh, di-reload, atau
 * dimulai ulang, progress kembali ke kondisi awal.
 *
 * Alasan: fitur login belum tersedia. Saat login dibuat nanti,
 * penyimpanan permanen bisa diaktifkan kembali di modul ini saja
 * (API halaman lain tidak perlu berubah).
 *
 * API tetap async supaya semua pemanggil (Home, Learning Path, Progress,
 * Profil, Explore, hooks) tidak perlu diubah.
 */
import {
  findMaterialById,
  getLearningPath,
  sanitizeCompleted,
  countCompleted,
} from "@/data/learning-path";
import AsyncStorage from "@react-native-async-storage/async-storage";

//
// Sumber data utama: skill yang sudah dimulai + status materi tiap skill.
// Persentase TIDAK disimpan — selalu dihitung dari materi selesai.
//

/**
 * Kunci lama yang dulu dipakai penyimpanan permanen. Tidak lagi dibaca
 * atau ditulis; dibersihkan sekali saat sesi baru agar progress lama
 * dari build sebelumnya tidak muncul kembali.
 * (Dipertahankan sebagai export konstanta agar import lama tetap valid.)
 */
export const progressStorageKey = "@skill-track/progress/v1";

/** Kunci penyimpanan legacy learning path HTML (kompatibilitas import). */
export const legacyProgressKeys = [
  progressStorageKey,
  "@skill-track/learning-path/html/completed",
  // Aktivitas mingguan juga data progress belajar — ikut dibersihkan.
  "@skill-track/profile/activity",
] as const;

type StoredState = {
  /** Id skill yang sudah dimulai (urutan mulai). */
  started: string[];
  /** Id materi yang sudah selesai di semua skill. */
  completed: string[];
};

/** Snapshot state yang aman dipakai semua halaman. */
export type ProgressState = StoredState;

const initialState: ProgressState = { started: [], completed: [] };

/** State sesi di memori — sumber tunggal selama aplikasi berjalan. */
let cache: ProgressState = initialState;

/** Listener dipanggil saat state berubah (untuk update antar halaman). */
type Listener = (state: ProgressState) => void;
const listeners = new Set<Listener>();

/** Subscribe perubahan state; kembalikan fungsi berhenti berlangganan. */
export function subscribeProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(state: ProgressState) {
  for (const listener of listeners) {
    listener(state);
  }
}

// Bersihkan sisa key permanen dari build lama (sekali per sesi) supaya
// progress lama tidak pernah muncul kembali dari storage.
let cleanupDone = false;
async function cleanupLegacyStorage(): Promise<void> {
  if (cleanupDone) {
    return;
  }
  cleanupDone = true;
  try {
    await AsyncStorage.multiRemove([...legacyProgressKeys]);
  } catch {
    // Gagal membersihkan tidak memengaruhi sesi in-memory.
  }
}

/**
 * Baca state progres sesi ini. Selalu diselesaikan secara async agar
 * pemanggil yang sudah awaits tetap berjalan; datanya dari memori.
 */
export async function loadProgress(): Promise<ProgressState> {
  await cleanupLegacyStorage();
  return cache;
}

/** Terapkan state baru ke memori dan broadcast ke listener. */
function applyState(next: ProgressState): ProgressState {
  cache = next;
  notify(next);
  return next;
}

/** Mulai sebuah skill (idempotent); return state terbaru. */
export async function startSkill(skillId: string): Promise<ProgressState> {
  await cleanupLegacyStorage();
  if (!getLearningPath(skillId) || cache.started.includes(skillId)) {
    return cache;
  }
  return applyState({ ...cache, started: [...cache.started, skillId] });
}

/**
 * Tandai satu materi selesai. Gating (materi terkunci) tetap dihalaman
 * pemanggil, tetapi di sini dicek ulang agar tidak ada progres ganda:
 * id sudah pernah selesai, atau skill belum dimulai, tidak diubah.
 */
export async function completeMaterial(materialId: string): Promise<ProgressState> {
  const state = await loadProgress();
  const resolved = resolveMaterial(materialId);
  const path = resolved?.path;
  if (!resolved || !path) {
    return state;
  }
  if (!state.started.includes(path.skillId)) {
    return state;
  }
  if (state.completed.includes(materialId)) {
    return state;
  }
  return applyState({
    ...state,
    completed: [...state.completed, materialId],
  });
}

/** Batalkan penyelesaian satu materi (jarang diperlukan). */
export async function uncompleteMaterial(materialId: string): Promise<ProgressState> {
  const state = await loadProgress();
  if (!state.completed.includes(materialId)) {
    return state;
  }
  return applyState({
    ...state,
    completed: state.completed.filter((id) => id !== materialId),
  });
}

/**
 * Hapus seluruh progress sesi. Dipakai uji/debug dipakai program;
 * dipanggil juga saat pemanggil ingin memulai sesi bersih.
 */
export async function resetProgress(): Promise<void> {
  await cleanupLegacyStorage();
  applyState({ started: [], completed: [] });
}

/** Cari learning path + materi berdasarkan id materi. */
export function resolveMaterial(materialId: string) {
  return findMaterialById(materialId);
}

/** Validasi/bersihkan daftar id terhadap materi (helper reuse). */
export function sanitizeSessionMaterials(
  path: NonNullable<ReturnType<typeof getLearningPath>>,
  ids: readonly string[],
): string[] {
  return sanitizeCompleted(path.materials, ids);
}

//
// Derivasi state: hitung turunan (progres, status, materi berikutnya)
// dari ProgressState — persentase tidak pernah disimpan.
//

/** Materi terakhir yang belum selesai pada satu skill; null jika semua selesai. */
export function nextOpenMaterial(
  path: NonNullable<ReturnType<typeof getLearningPath>>,
  state: ProgressState,
): { id: string; title: string; description: string } | null {
  const activeIndex = path.materials.findIndex(
    (material) => !state.completed.includes(material.id),
  );
  const material = activeIndex >= 0 ? path.materials[activeIndex] : null;
  return material
    ? { id: material.id, title: material.title, description: material.description }
    : null;
}

/** Skill yang sudah dimulai beserta data path-nya (urut sesuai dimulai). */
export function startedPaths(state: ProgressState) {
  return state.started
    .map((id) => getLearningPath(id))
    .filter((path): path is NonNullable<ReturnType<typeof getLearningPath>> => path !== null);
}

/** Statistik ringkas untuk Home, Progress, dan Profil. */
export type ProgressSummary = {
  /** Jumlah skill aktif (yang sudah dimulai). */
  activeSkills: number;
  /** Jumlah materi selesai pada skill yang sudah dimulai. */
  completedMaterials: number;
  /** Total materi pada skill yang sudah dimulai. */
  totalMaterials: number;
  /** Persen keseluruhan 0–100 (0 jika belum ada skill dimulai). */
  overallPercent: number;
};

export function computeSummary(state: ProgressState): ProgressSummary {
  const paths = startedPaths(state);
  let completedMaterials = 0;
  let totalMaterials = 0;
  for (const path of paths) {
    completedMaterials += countCompleted(path.materials, state.completed);
    totalMaterials += path.materials.length;
  }
  return {
    activeSkills: paths.length,
    completedMaterials,
    totalMaterials,
    overallPercent:
      totalMaterials > 0
        ? Math.round((completedMaterials / totalMaterials) * 100)
        : 0,
  };
}
