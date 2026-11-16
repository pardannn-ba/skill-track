/**
 * Sumber data tunggal untuk semua skill di aplikasi.
 * Dipakai bersama oleh halaman Explore, filter kategori, dan halaman detail.
 */
export type SkillCategory = "Programming" | "Design" | "Language";

export type SkillLevel = "Pemula" | "Menengah" | "Lanjut";

export type SkillIconName = "html" | "css" | "uiux" | "english";

export type Skill = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  level: SkillLevel;
  icon: SkillIconName;
  /** Jumlah materi di dalam skill ini. */
  totalMaterials: number;
};

export const skillsData: Skill[] = [
  {
    id: "html",
    name: "HTML",
    description: "Dasar pembuatan halaman web",
    category: "Programming",
    level: "Pemula",
    icon: "html",
    totalMaterials: 5,
  },
  {
    id: "css",
    name: "CSS",
    description: "Membuat tampilan halaman web",
    category: "Programming",
    level: "Pemula",
    icon: "css",
    totalMaterials: 4,
  },
  {
    id: "uiux",
    name: "UI/UX Design",
    description: "Desain antarmuka yang menarik",
    category: "Design",
    level: "Pemula",
    icon: "uiux",
    totalMaterials: 6,
  },
  {
    id: "english",
    name: "English",
    description: "Meningkatkan kemampuan bahasa Inggris",
    category: "Language",
    level: "Pemula",
    icon: "english",
    totalMaterials: 5,
  },
];

export const skillCategories: ("All" | SkillCategory)[] = [
  "All",
  "Programming",
  "Design",
  "Language",
];
