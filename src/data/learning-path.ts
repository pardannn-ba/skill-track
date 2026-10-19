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
const htmlPath: LearningPath = {
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

/** Learning Path CSS. */
const cssPath: LearningPath = {
  skillId: "css",
  skillName: "CSS",
  subtitle: "Jalur belajar pemula",
  level: "Pemula",
  icon: "css",
  materials: [
    {
      id: "css-1",
      title: "Pengenalan CSS",
      description: "Apa itu CSS dan fungsinya",
      points: [
        "Pengertian CSS dan hubungannya dengan HTML",
        "Cara menulis CSS: inline, internal, eksternal",
        "Sintaks selector, property, dan value",
      ],
    },
    {
      id: "css-2",
      title: "Selector & Warna",
      description: "Memilih elemen dan memberi warna",
      points: [
        "Selector tag, class, dan id",
        "Warna dengan nama, hex, dan rgb",
        "Background dan text color",
      ],
    },
    {
      id: "css-3",
      title: "Box Model & Layout",
      description: "Mengatur jarak dan ukuran",
      points: [
        "Padding, margin, dan border",
        "Width, height, dan box-sizing",
        "Display block, inline, dan inline-block",
      ],
    },
    {
      id: "css-4",
      title: "Flexbox & Responsif",
      description: "Layout modern dan media query",
      points: [
        "Flex container dan flex item",
        "justify-content dan align-items",
        "Media query untuk layar kecil",
      ],
    },
  ],
};

/** Learning Path UI/UX Design. */
const uiuxPath: LearningPath = {
  skillId: "uiux",
  skillName: "UI/UX Design",
  subtitle: "Jalur belajar pemula",
  level: "Pemula",
  icon: "uiux",
  materials: [
    {
      id: "uiux-1",
      title: "Pengenalan UI/UX",
      description: "Apa itu UI dan UX",
      points: [
        "Perbedaan UI dan UX",
        "Peran designer dalam produk digital",
        "Proses desain dari riset hingga uji coba",
      ],
    },
    {
      id: "uiux-2",
      title: "Riset Pengguna",
      description: "Mengenal kebutuhan pengguna",
      points: [
        "Wawancara dan survei pengguna",
        "User persona sederhana",
        "Menyusun masalah utama pengguna",
      ],
    },
    {
      id: "uiux-3",
      title: "Wireframe",
      description: "Sketsa struktur halaman",
      points: [
        "Low-fidelity vs high-fidelity",
        "Menyusun layout dengan wireframe",
        "Hierarki informasi pada halaman",
      ],
    },
    {
      id: "uiux-4",
      title: "Desain Visual",
      description: "Warna, tipografi, dan spacing",
      points: [
        "Memilih palet warna yang konsisten",
        "Tipografi dan ukuran teks",
        "Spacing dan grid yang rapi",
      ],
    },
    {
      id: "uiux-5",
      title: "Prototype",
      description: "Desain yang bisa dicoba",
      points: [
        "Membuat alur navigasi antar layar",
        "Interaksi sederhana pada prototype",
        "Menyiapkan prototype untuk diuji",
      ],
    },
    {
      id: "uiux-6",
      title: "Usability Testing",
      description: "Menguji desain ke pengguna",
      points: [
        "Menyusun skenario pengujian",
        "Mengamati perilaku pengguna",
        "Iterasi desain dari hasil pengujian",
      ],
    },
  ],
};

/** Learning Path English. */
const englishPath: LearningPath = {
  skillId: "english",
  skillName: "English",
  subtitle: "Jalur belajar pemula",
  level: "Pemula",
  icon: "english",
  materials: [
    {
      id: "english-1",
      title: "Pengenalan Bahasa Inggris",
      description: "Memulai belajar bahasa Inggris",
      points: [
        "Alfabet dan pelafalan dasar",
        "Sapaan dan perkenalan diri",
        "Kata benda dan kata kerja sederhana",
      ],
    },
    {
      id: "english-2",
      title: "Vocabulary Dasar",
      description: "Menambah jumlah kata",
      points: [
        "Kata sehari-hari: rumah, sekolah, keluarga",
        "Angka, hari, dan bulan",
        "Cara mencatat kosakata baru",
      ],
    },
    {
      id: "english-3",
      title: "Grammar Sederhana",
      description: "Menyusun kalimat benar",
      points: [
        "Kalimat simple present",
        "Artikel a, an, dan the",
        "Kata ganti I, you, we, they",
      ],
    },
    {
      id: "english-4",
      title: "Percakapan Sehari-hari",
      description: "Berbicara dalam situasi umum",
      points: [
        "Bertanya dan menjawab sederhana",
        "Berbelanja dan memesan makanan",
        "Menyapa dengan sopan",
      ],
    },
    {
      id: "english-5",
      title: "Listening & Reading",
      description: "Melatih pendengaran dan membaca",
      points: [
        "Mendengar dialog pendek",
        "Membaca teks sederhana",
        "Menjawab pertanyaan pemahaman",
      ],
    },
  ],
};

/** Semua learning path yang tersedia di aplikasi (urut seperti skillsData). */
export const learningPaths: LearningPath[] = [htmlPath, cssPath, uiuxPath, englishPath];

/** Alias lama agar file lain yang memakai htmlLearningPath tetap bekerja. */
export const htmlLearningPath: LearningPath = htmlPath;

/** Ambil learning path berdasarkan id skill; null jika id tidak dikenal. */
export function getLearningPath(skillId: string): LearningPath | null {
  return learningPaths.find((path) => path.skillId === skillId) ?? null;
}

/** Cari materi berdasarkan id unik di seluruh skill. */
export function findMaterialById(
  materialId: string,
): { path: LearningPath; index: number; material: LearningMaterial } | null {
  for (const path of learningPaths) {
    const index = path.materials.findIndex((material) => material.id === materialId);
    if (index >= 0) {
      return { path, index, material: path.materials[index] };
    }
  }
  return null;
}

/** Kunci penyimpanan progres Learning Path HTML (kompatibilitas data lama). */
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
