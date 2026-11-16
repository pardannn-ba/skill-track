
import { subscribeSession } from "@/data/auth";
import {
  countCompleted,
  findMaterialById,
  getLearningPath,
  learningPaths,
  sanitizeCompleted,
} from "@/data/learning-path";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ========================================
// DATABASE MAPPING
// ========================================

// ID skill lokal aplikasi -> ID skill Supabase.
const databaseSkillIds: Record<string, number> = {
  html: 1,
  css: 2,
  uiux: 3,
  english: 4,
};

type DatabaseMaterial = {
  id: number;
  skill_id: number;
  order_number: number;
};

// Pemetaan ID materi lokal -> ID materi Supabase.
let databaseMaterialIds = new Map<string, number>();

// ========================================
// PROGRESS STATE
// ========================================

export const progressStorageKey = "@skill-track/progress/v1";

export const legacyProgressKeys = [
  progressStorageKey,
  "@skill-track/learning-path/html/completed",
  "@skill-track/profile/activity",
] as const;

type StoredState = {
  started: string[];
  completed: string[];
};

export type ProgressState = StoredState;

const initialState: ProgressState = {
  started: [],
  completed: [],
};

let cache: ProgressState = initialState;
let loadedForUser: string | null = null;

type Listener = (state: ProgressState) => void;
const listeners = new Set<Listener>();

export function subscribeProgress(
  listener: Listener
): () => void {
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

function applyState(next: ProgressState): ProgressState {
  cache = next;
  notify(next);
  return next;
}

// ========================================
// SESSION & LEGACY STORAGE
// ========================================

let progressOwner: string | null = null;

subscribeSession((session) => {
  const owner = session?.username ?? null;

  if (owner !== progressOwner) {
    progressOwner = owner;
    loadedForUser = null;
    databaseMaterialIds.clear();
    applyState(initialState);
  }
});

let cleanupDone = false;

async function cleanupLegacyStorage(): Promise<void> {
  if (cleanupDone) return;

  cleanupDone = true;

  try {
    await AsyncStorage.multiRemove([...legacyProgressKeys]);
  } catch (error) {
    console.warn("Gagal membersihkan progress lama:", error);
  }
}

// ========================================
// HELPER
// ========================================

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  return data.session?.user.id ?? null;
}

function createMaterialMapping(rows: DatabaseMaterial[]) {
  const rowsByPosition = new Map<string, DatabaseMaterial>();

  for (const row of rows) {
    rowsByPosition.set(
      `${row.skill_id}:${row.order_number}`,
      row
    );
  }

  const mapping = new Map<string, number>();

  for (const path of learningPaths) {
    const databaseSkillId = databaseSkillIds[path.skillId];

    if (!databaseSkillId) continue;

    path.materials.forEach((material, index) => {
      const orderNumber = index + 1;

      const databaseMaterial = rowsByPosition.get(
        `${databaseSkillId}:${orderNumber}`
      );

      if (databaseMaterial) {
        mapping.set(material.id, databaseMaterial.id);
      }
    });
  }

  return mapping;
}

// ========================================
// LOAD PROGRESS FROM SUPABASE
// ========================================

export async function loadProgress(): Promise<ProgressState> {
  await cleanupLegacyStorage();

  const userId = await getCurrentUserId();

  if (!userId) {
    loadedForUser = null;
    databaseMaterialIds.clear();
    return applyState(initialState);
  }

  // Jika data akun ini sudah dimuat, gunakan cache.
  if (loadedForUser === userId) {
    return cache;
  }

  const [skillsResult, progressResult, materialsResult] =
    await Promise.all([
      supabase
        .from("user_skills")
        .select("skill_id")
        .eq("user_id", userId),

      supabase
        .from("user_progress")
        .select("material_id, is_completed")
        .eq("user_id", userId),

      supabase
        .from("materials")
        .select("id, skill_id, order_number"),
    ]);

  if (skillsResult.error) throw skillsResult.error;
  if (progressResult.error) throw progressResult.error;
  if (materialsResult.error) throw materialsResult.error;

  const materialRows =
    materialsResult.data as DatabaseMaterial[];

  databaseMaterialIds = createMaterialMapping(materialRows);

  const started = (skillsResult.data ?? [])
    .map((row) =>
      Object.entries(databaseSkillIds).find(
        ([, databaseId]) => databaseId === row.skill_id
      )?.[0]
    )
    .filter((id): id is string => Boolean(id));

  const reverseMaterialMapping = new Map<number, string>();

  for (const [localId, databaseId] of databaseMaterialIds) {
    reverseMaterialMapping.set(databaseId, localId);
  }

  const completed = (progressResult.data ?? [])
    .filter((row) => row.is_completed === true)
    .map((row) => reverseMaterialMapping.get(row.material_id))
    .filter((id): id is string => Boolean(id));

  loadedForUser = userId;

  return applyState({
    started,
    completed,
  });
}

// ========================================
// START SKILL
// ========================================

export async function startSkill(
  skillId: string
): Promise<ProgressState> {
  const state = await loadProgress();

  const databaseSkillId = databaseSkillIds[skillId];

  if (!getLearningPath(skillId) || !databaseSkillId) {
    return state;
  }

  if (state.started.includes(skillId)) {
    return state;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Kamu harus login terlebih dahulu.");
  }

  // Periksa apakah skill sudah pernah dimulai.
  const { data: existing, error: checkError } = await supabase
    .from("user_skills")
    .select("skill_id")
    .eq("user_id", userId)
    .eq("skill_id", databaseSkillId)
    .limit(1);

  if (checkError) throw checkError;

  // Simpan hanya jika belum ada.
  if (!existing || existing.length === 0) {
    const { error } = await supabase
      .from("user_skills")
      .insert({
        user_id: userId,
        skill_id: databaseSkillId,
      });

    if (error) throw error;
  }

  return applyState({
    ...state,
    started: [...state.started, skillId],
  });
}

// ========================================
// COMPLETE MATERIAL
// ========================================

export async function completeMaterial(
  materialId: string
): Promise<ProgressState> {
  const state = await loadProgress();

  const resolved = resolveMaterial(materialId);
  const path = resolved?.path;

  if (!resolved || !path) return state;

  if (!state.started.includes(path.skillId)) {
    return state;
  }

  if (state.completed.includes(materialId)) {
    return state;
  }

  const databaseMaterialId = databaseMaterialIds.get(materialId);

  if (!databaseMaterialId) {
    throw new Error(
      `ID database untuk materi ${materialId} tidak ditemukan.`
    );
  }

  // Panggil fungsi PostgreSQL yang sudah dibuat sebelumnya.
  // Fungsi ini juga memeriksa urutan penyelesaian materi.
  const { error } = await supabase.rpc("complete_material", {
    p_material_id: databaseMaterialId,
  });

  if (error) throw error;

  return applyState({
    ...state,
    completed: [...state.completed, materialId],
  });
}

// ========================================
// UNCOMPLETE MATERIAL
// ========================================

// Belum menghapus progres dari database karena belum ada
// fungsi database khusus untuk membatalkan penyelesaian.
export async function uncompleteMaterial(
  materialId: string
): Promise<ProgressState> {
  return loadProgress();
}

// ========================================
// RESET PROGRESS
// ========================================

// Hanya mengosongkan cache lokal.
// Tidak menghapus data permanen di Supabase.
export async function resetProgress(): Promise<void> {
  applyState(initialState);
}

// ========================================
// MATERIAL HELPERS
// ========================================

export function resolveMaterial(materialId: string) {
  return findMaterialById(materialId);
}

export function sanitizeSessionMaterials(
  path: NonNullable<ReturnType<typeof getLearningPath>>,
  ids: readonly string[]
): string[] {
  return sanitizeCompleted(path.materials, ids);
}

// ========================================
// DERIVED PROGRESS
// ========================================

export function nextOpenMaterial(
  path: NonNullable<ReturnType<typeof getLearningPath>>,
  state: ProgressState
): { id: string; title: string; description: string } | null {
  const activeIndex = path.materials.findIndex(
    (material) => !state.completed.includes(material.id)
  );

  const material =
    activeIndex >= 0 ? path.materials[activeIndex] : null;

  return material
    ? {
        id: material.id,
        title: material.title,
        description: material.description,
      }
    : null;
}

export function startedPaths(state: ProgressState) {
  return state.started
    .map((id) => getLearningPath(id))
    .filter(
      (path): path is NonNullable<
        ReturnType<typeof getLearningPath>
      > => path !== null
    );
}

export type ProgressSummary = {
  activeSkills: number;
  completedMaterials: number;
  totalMaterials: number;
  overallPercent: number;
};

export function computeSummary(
  state: ProgressState
): ProgressSummary {
  const paths = startedPaths(state);

  let completedMaterials = 0;
  let totalMaterials = 0;

  for (const path of paths) {
    completedMaterials += countCompleted(
      path.materials,
      state.completed
    );

    totalMaterials += path.materials.length;
  }

  return {
    activeSkills: paths.length,
    completedMaterials,
    totalMaterials,
    overallPercent:
      totalMaterials > 0
        ? Math.round(
            (completedMaterials / totalMaterials) * 100
          )
        : 0,
  };
}
