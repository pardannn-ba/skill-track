"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningStorageKey = exports.htmlLearningPath = void 0;
exports.sanitizeCompleted = sanitizeCompleted;
exports.getActiveMaterialIndex = getActiveMaterialIndex;
exports.getMaterialStatus = getMaterialStatus;
exports.countCompleted = countCompleted;
exports.computeProgress = computeProgress;
exports.completeActiveMaterial = completeActiveMaterial;
/** Learning Path HTML — halaman detail skill pada screenshot referensi. */
exports.htmlLearningPath = {
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
exports.learningStorageKey = "@skill-track/learning-path/html/completed";
/**
 * Buang id duplikat dan id yang tidak valid sehingga
 * materi yang sudah selesai tidak pernah dihitung dua kali.
 */
function sanitizeCompleted(materials, ids) {
    const validIds = new Set(materials.map((material) => material.id));
    return [...new Set(ids)].filter((id) => validIds.has(id));
}
/** Index materi pertama yang belum selesai; -1 jika semuanya selesai. */
function getActiveMaterialIndex(materials, completedIds) {
    return materials.findIndex((material) => !completedIds.includes(material.id));
}
/** Status materi pada posisi `index` berdasarkan daftar yang sudah selesai. */
function getMaterialStatus(materials, index, completedIds) {
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
function countCompleted(materials, completedIds) {
    const completedSet = new Set(completedIds);
    return materials.filter((material) => completedSet.has(material.id)).length;
}
/** Progress dalam persen (0–100), dibulatkan. */
function computeProgress(materials, completedIds) {
    if (materials.length === 0) {
        return 0;
    }
    return Math.round((countCompleted(materials, completedIds) / materials.length) * 100);
}
/**
 * Tandai materi yang sedang aktif sebagai selesai.
 * Mengembalikan salinan daftar baru; id tidak pernah duplikat dan
 * tidak ada materi terkunci yang bisa diselesaikan.
 */
function completeActiveMaterial(materials, completedIds) {
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
