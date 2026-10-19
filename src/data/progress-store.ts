import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  findMaterialById,
  getLearningPath,
  learningStorageKey,
  sanitizeCompleted,
  countCompleted,
} from "@/data/learning-path";

//
// Sumber data utama: skill yang sudah dimulai + status materi tiap skill.
// Persentase TIDAK disimpan — selalu dihitung dari materi selesai.
//

/** Kunci penyimpanan state progres utama (AsyncStorage). */
export const progressStorageKey = "@skill-track/progress/v1";

type StoredState = {
  /** Id skill yang sudah dimulai (urutan mulai). */
  started: string[];
  /** Id materi yang sudah selesai di semua skill. */
  completed: string[];
};

/** Snapshot state yang aman dipakai semua halaman. */
export type ProgressState = StoredState;

const initialState: ProgressState = { started: [], completed: [] };

/** Bentuk data lama: hanya html completed. Migrasi otomatis sekali. */
const legacyHtmlKey = learningStorageKey;

let cache: ProgressState | null = null;
let cachePromise: Promise<ProgressState> | null = null;

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

/** Sanitasi data mentah dari storage menjadi state valid. */
function toValidState(value: unknown): ProgressState {
  if (typeof value !== "object" || value === null) {
    return initialState;
  }
  const raw = value as { started?: unknown; completed?: unknown };
  const started = Array.isArray(raw.started)
    ? raw.started.filter((id): id is string => typeof id === "string")
    : [];
  const completed = Array.isArray(raw.completed)
    ? raw.completed.filter((id): id is string => typeof id === "string")
    : [];
  return {
    // Hanya skill yang punya learning path yang boleh tersimpan.
    started: started.filter((id) => getLearningPath(id) !== null),
    completed: [...new Set(completed)],
  };
}

/** Baca state tersimpan; sekali load lalu dipakai ulang dari cache. */
export async function loadProgress(): Promise<ProgressState> {
  if (cache) {
    return cache;
  }
  if (!cachePromise) {
    cachePromise = (async () => {
      try {
        // Migrasi data lama (learning path HTML saja) ke format baru.
        const [mainRaw, legacyRaw] = await AsyncStorage.multiGet([
          progressStorageKey,
          legacyHtmlKey,
        ]);
        const mainState = toValidState(
          mainRaw[1] ? JSON.parse(mainRaw[1]) : undefined,
        );
        let legacyCompleted: string[] = [];
        if (legacyRaw[1]) {
          try {
            const parsed: unknown = JSON.parse(legacyRaw[1]);
            if (Array.isArray(parsed)) {
              const htmlPath = getLearningPath("html");
              legacyCompleted = htmlPath
                ? sanitizeCompleted(
                    htmlPath.materials,
                    parsed.filter((v): v is string => typeof v === "string"),
                  )
                : [];
            }
          } catch {
            legacyCompleted = [];
          }
        }
        const merged: ProgressState = {
          // Jika sudah ada state baru, pakai itu; legacy hanya menambah skill.
          started: mainState.started.length
            ? mainState.started
            : legacyCompleted.length > 0
              ? ["html"]
              : [],
          completed: [
            ...new Set([...legacyCompleted, ...mainState.completed]),
          ],
        };
        cache = merged;
        return merged;
      } catch {
        // Gagal membaca = mulai dari state kosong (pengguna baru).
        cache = initialState;
        return initialState;
      } finally {
        cachePromise = null;
      }
    })();
  }
  return cachePromise;
}

/** Tulis state ke AsyncStorage dan broadcast ke listener. */
async function persist(next: ProgressState): Promise<ProgressState> {
  cache = next;
  notify(next);
  try {
    await AsyncStorage.setItem(progressStorageKey, JSON.stringify(next));
  } catch {
    // Gagal menulis tidak boleh merusak UI; cache tetap dipakai.
  }
  return next;
}

/** Mulai sebuah skill (idempotent); return state terbaru. */
export async function startSkill(skillId: string): Promise<ProgressState> {
  const state = await loadProgress();
  if (!getLearningPath(skillId) || state.started.includes(skillId)) {
    return state;
  }
  return persist({ ...state, started: [...state.started, skillId] });
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
  return persist({ ...state, completed: [...state.completed, materialId] });
}

/** Batalkan penyelesaian satu materi (dipakai uji/sinkron, jarang diperlukan). */
export async function uncompleteMaterial(materialId: string): Promise<ProgressState> {
  const state = await loadProgress();
  if (!state.completed.includes(materialId)) {
    return state;
  }
  return persist({
    ...state,
    completed: state.completed.filter((id) => id !== materialId),
  });
}

/** Hapus seluruh data progres (fitur reset/debug). */
export async function resetProgress(): Promise<void> {
  cache = initialState;
  notify(initialState);
  try {
    await AsyncStorage.removeItem(progressStorageKey);
    await AsyncStorage.removeItem(legacyHtmlKey);
  } catch {
    // Abaikan; cache sudah baru.
  }
}

/** Cari learning path + materi berdasarkan id materi. */
export function resolveMaterial(materialId: string) {
  return findMaterialById(materialId);
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
