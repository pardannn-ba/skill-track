import type { SkillIconName } from "@/data/skills";

/** Status sebuah materi di dalam timeline Learning Path. */
export type LearningMaterialStatus = "completed" | "active" | "locked";

export type LearningMaterial = {
  /** Id unik materi; juga dipakai sebagai kunci penyimpanan progres. */
  id: string;
  title: string;
  description: string;
  /** Poin pembelajaran singkat yang tampil di halaman detail materi. */
  points: readonly string[];
};

export type LearningPath = {
  skillId: string;
  skillName: string;
  subtitle: string;
  level: string;
  icon: SkillIconName;
  materials: readonly LearningMaterial[];
};

/** Learning Path HTML — halaman detail skill pada screenshot referensi. */
export const htmlLearningPath: LearningPath = {
  skillId: "html",
  skillName: "HTML",
  subtitle: "Jalur belajar pemula",
  level: "Pemula",
  icon: "html",
  materials: [
    {
      id: "html-1",
      title: "Pengenalan HTML",
      description: "Apa itu HTML dan fungsinya",
      points: [
        "Pengertian HTML dan fungsinya di web",
        "Struktur dasar sebuah dokumen HTML",
        "Tag, elemen, dan atribut",
      ],
    },
    {
      id: "html-2",
      title: "Heading & Paragraf",
      description: "Membuat judul dan teks",
      points: [
        "Judul dari h1 sampai h6",
        "Paragraf dengan tag <p>",
        "Line break dan teks penting",
      ],
    },
    {
      id: "html-3",
      title: "Link dan Gambar",
      description: "Menambahkan link dan gambar",
      points: [
        "Tautan dengan tag <a> dan atribut href",
        "Gambar dengan tag <img>, src, dan alt",
        "Link internal maupun eksternal",
      ],
    },
    {
      id: "html-4",
      title: "Form HTML",
      description: "Membuat form sederhana",
      points: [
        "Form dengan <form>, <input>, dan <label>",
        "Jenis input: teks, email, radio, checkbox",
        "Tombol submit dan validasi required",
      ],
    },
    {
      id: "html-5",
      title: "Tabel dan List",
      description: "Membuat tabel dan daftar",
      points: [
        "Tabel dengan <table>, <tr>, <th>, dan <td>",
        "List tidak berurutan dengan <ul> dan <li>",
        "List berurutan dengan <ol> dan <li>",
      ],
    },
  ],
};

/** Kunci penyimpanan progres Learning Path (AsyncStorage). */
export const learningStorageKey = "@skill-track/learning-path/html/completed";

/**
 * Buang id duplikat dan id yang tidak valid sehingga
 * materi yang sudah selesai tidak pernah dihitung dua kali.
 */
export function sanitizeCompleted(
  materials: readonly LearningMaterial[],
  ids: readonly string[],
): string[] {
  const validIds = new Set(materials.map((material) => material.id));
  return [...new Set(ids)].filter((id) => validIds.has(id));
}

/** Index materi pertama yang belum selesai; -1 jika semuanya selesai. */
export function getActiveMaterialIndex(
  materials: readonly LearningMaterial[],
  completedIds: readonly string[],
): number {
  return materials.findIndex((material) => !completedIds.includes(material.id));
}

/** Status materi pada posisi `index` berdasarkan daftar yang sudah selesai. */
export function getMaterialStatus(
  materials: readonly LearningMaterial[],
  index: number,
  completedIds: readonly string[],
): LearningMaterialStatus {
  const material = materials[index];
  if (!material) {
    return "locked";
  }
  if (completedIds.includes(material.id)) {
    return "completed";
  }
  return index === getActiveMaterialIndex(materials, completedIds)
    ? "active"
    : "locked";
}

/** Jumlah materi yang sudah diselesaikan (tanpa duplikat). */
export function countCompleted(
  materials: readonly LearningMaterial[],
  completedIds: readonly string[],
): number {
  const completedSet = new Set(completedIds);
  return materials.filter((material) => completedSet.has(material.id)).length;
}

/** Progress dalam persen (0–100), dibulatkan. */
export function computeProgress(
  materials: readonly LearningMaterial[],
  completedIds: readonly string[],
): number {
  if (materials.length === 0) {
    return 0;
  }
  return Math.round(
    (countCompleted(materials, completedIds) / materials.length) * 100,
  );
}

/**
 * Tandai materi yang sedang aktif sebagai selesai.
 * Mengembalikan salinan daftar baru; id tidak pernah duplikat dan
 * tidak ada materi terkunci yang bisa diselesaikan.
 */
export function completeActiveMaterial(
  materials: readonly LearningMaterial[],
  completedIds: readonly string[],
): string[] {
  const activeIndex = getActiveMaterialIndex(materials, completedIds);
  const activeMaterial = activeIndex >= 0 ? materials[activeIndex] : undefined;
  if (!activeMaterial) {
    return [...completedIds];
  }
  if (completedIds.includes(activeMaterial.id)) {
    return [...completedIds];
  }
  return [...completedIds, activeMaterial.id];
}
