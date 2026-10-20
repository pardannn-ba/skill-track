import type { SkillIconName } from "@/data/skills";

/** Status sebuah materi di dalam timeline Learning Path. */
export type LearningMaterialStatus = "completed" | "active" | "locked";

export type LearningMaterial = {
  /** Id unik materi; juga dipakai sebagai kunci penyimpanan progres. */
  id: string;
  title: string;
  description: string;
  /** Penjelasan materi yang tampil saat kartu materi dibuka. */
  explanation: string;
  /**
   * Blok contoh kode Learning Path non-Bahasa Inggris.
   * Untuk materi Bahasa Inggris bidang ini tidak dipakai (opsional) —
   * konten bahasa ditampilkan lewat `english`.
   */
  codeExample?: string;
  /** URL referensi eksternal untuk materi ini. */
  referenceUrl: string;
  /** Poin pembelajaran singkat yang tampil di halaman detail materi. */
  points: readonly string[];
  /**
   * Konten khusus materi Bahasa Inggris (detail bahasa, bukan kode):
   * contoh kalimat berikut terjemahannya, vocabulary, dan latihan interaktif.
   */
  english?: EnglishMaterialContent;
};

/** Satu contoh: kalimat Bahasa Inggris + terjemahan Indonesia. */
export type EnglishExample = {
  sentence: string;
  translation: string;
};

/** Satu kosakata: kata Bahasa Inggris + artinya di Bahasa Indonesia. */
export type EnglishVocabulary = {
  word: string;
  meaning: string;
};

/** Latihan pilihan ganda dengan kunci jawaban dan penjelasan. */
export type EnglishChoiceExercise = {
  type: "choice";
  question: string;
  options: readonly string[];
  /** Index jawaban benar pada `options`. */
  correctIndex: number;
  /** Penjelasan yang muncul setelah pengguna menjawab. */
  explanation: string;
};

/** Latihan melengkapi kalimat dengan satu jawaban pendek. */
export type EnglishFillExercise = {
  type: "fill";
  /** Kalimat atau pertanyaan dengan bagian yang harus dilengkapi. */
  question: string;
  /** Jawaban benar (tanpa membedakan huruf besar/kecil). */
  answer: string;
  /** Penjelasan yang muncul setelah pengguna menjawab. */
  explanation: string;
};

/** Bentuk latihan Bahasa Inggris: pilihan ganda atau melengkapi kalimat. */
export type EnglishExercise =
  | EnglishChoiceExercise
  | EnglishFillExercise;

/** Konten penting dari materi Bahasa Inggris sesuai topiknya. */
export type EnglishMaterialContent = {
  /** Contoh kalimat dengan terjemahan; opsional untuk setiap topik. */
  examples?: readonly EnglishExample[];
  /** Daftar kosakata dengan arti; tidak wajib di semua materi. */
  vocabulary?: readonly EnglishVocabulary[];
  /** Latihan interaktif; material tanpa latihan tetap valid. */
  exercises?: readonly EnglishExercise[];
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
      explanation:
        "HTML adalah bahasa markup yang digunakan untuk menyusun struktur halaman web. Dengan HTML, kita bisa membuat elemen seperti judul, paragraf, gambar, dan tautan.",
      codeExample:
        "<!DOCTYPE html>\n<html>\n  <head>\n    <title>Halaman Web</title>\n  </head>\n  <body>\n    <h1>Selamat Datang!</h1>\n  </body>\n</html>",
      referenceUrl: "https://www.w3schools.com/html/html_intro.asp",
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
      explanation:
        "Tag <h1> sampai <h6> digunakan untuk membuat judul. Sedangkan tag <p> digunakan untuk menampilkan paragraf teks.",
      codeExample:
        "<h1>Judul Utama</h1>\n<p>Ini adalah paragraf.</p>",
      referenceUrl: "https://www.w3schools.com/html/html_headings.asp",
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
      explanation:
        "Tag <a> digunakan untuk membuat tautan ke halaman lain. Tag <img> digunakan untuk menampilkan gambar pada halaman web.",
      codeExample:
        '<a href="https://example.com">Kunjungi</a>\n<img src="gambar.jpg" alt="Gambar" />',
      referenceUrl: "https://www.w3schools.com/html/html_links.asp",
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
      explanation:
        "Tag <form> digunakan untuk mengumpulkan input dari pengguna. Di dalamnya ada tag <input>, <label>, dan tombol submit.",
      codeExample:
        '<form action="/kirim" method="post">\n  <label for="nama">Nama:</label>\n  <input type="text" id="nama" name="nama" required />\n  <button type="submit">Kirim</button>\n</form>',
      referenceUrl: "https://www.w3schools.com/html/html_forms.asp",
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
      explanation:
        "Tag <table> dengan <tr>, <th>, dan <td> digunakan untuk membuat tabel. Sedangkan <ul> dan <ol> digunakan untuk membuat daftar.",
      codeExample:
        '<table>\n  <tr><th>Nama</th><th>Umur</th></tr>\n  <tr><td>Andi</td><td>17</td></tr>\n</table>\n<ul>\n  <li>Satu</li>\n  <li>Dua</li>\n</ul>',
      referenceUrl: "https://www.w3schools.com/html/html_tables.asp",
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
      explanation:
        "CSS digunakan untuk memberi gaya pada halaman web: warna, ukuran, dan tata letak. CSS bisa ditulis inline, internal, atau dalam file terpisah.",
      codeExample:
        "body {\n  background-color: #071525;\n  color: #EFF6FF;\n}",
      referenceUrl: "https://www.w3schools.com/css/css_intro.asp",
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
      explanation:
        "Selector menentukan elemen mana yang diberi gaya: tag, class (.), atau id (#). Warna bisa ditulis dengan nama, hex, atau rgb.",
      codeExample:
        ".judul {\n  color: #2DD4BF;\n}\n#utama {\n  background: rgb(20, 38, 59);\n}",
      referenceUrl: "https://www.w3schools.com/css/css_selectors.asp",
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
      explanation:
        "Setiap elemen HTML adalah kotak yang terdiri dari content, padding, border, dan margin. Memahami box model penting untuk mengatur layout.",
      codeExample:
        ".kartu {\n  padding: 16px;\n  border: 1px solid #243E5B;\n  margin: 8px;\n  box-sizing: border-box;\n}",
      referenceUrl: "https://www.w3schools.com/css/css_boxmodel.asp",
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
      explanation:
        "Flexbox memudahkan penyusunan elemen secara horizontal maupun vertikal. Media query membuat tampilan menyesuaikan ukuran layar.",
      codeExample:
        ".baris {\n  display: flex;\n  justify-content: space-between;\n}\n@media (max-width: 600px) {\n  .baris { flex-direction: column; }\n}",
      referenceUrl: "https://www.w3schools.com/css/css3_flexbox.asp",
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
      explanation:
        "UI (User Interface) berkaitan dengan tampilan visual, sedangkan UX (User Experience) berkaitan dengan pengalaman pengguna saat memakai produk.",
      codeExample:
        "# Contoh peta proses desain\n1. Riset pengguna\n2. Wireframe\n3. Desain visual\n4. Prototype & uji",
      referenceUrl: "https://www.interaction-design.org/literature/topics/ui-design",
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
      explanation:
        "Riset pengguna membantu memahami masalah nyata lewat wawancara, survei, dan user persona sebelum mulai mendesain.",
      codeExample:
        "# Template user persona\nNama: Andi\nUsia: 17\nTujuan: Belajar web cepat\nKendala: Waktu terbatas",
      referenceUrl: "https://www.nngroup.com/articles/persona/",
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
      explanation:
        "Wireframe adalah sketsa kasar susunan elemen halaman: header, konten, dan tombol. Ini kerangka awal sebelum desain visual.",
      codeExample:
        "+----------------------+\n| Header               |\n+----------------------+\n| Hero                 |\n| [Tombol Mulai]       |\n+----------------------+\n| Footer               |\n+----------------------+",
      referenceUrl: "https://www.figma.com/resource-library/what-is-wireframing/",
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
      explanation:
        "Desain visual menerapkan palet warna, tipografi, dan spacing yang konsisten agar antarmuka nyaman dibaca dan digunakan.",
      codeExample:
        "# Contoh design token\nwarna-utama:   #2855F4\nwarna-teks:    #EFF6FF\nfont-judul:    28px / bold\nspacing-kartu: 16px",
      referenceUrl: "https://www.figma.com/resource-library/design-systems/",
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
      explanation:
        "Prototype menghubungkan layar-layar desain menjadi alur yang bisa diklik, sehingga alur navigasi bisa diuji sebelum dikembangkan.",
      codeExample:
        "Layar Login --[tekan Masuk]--> Layar Beranda\nLayar Beranda --[tekan Detail]--> Layar Detail",
      referenceUrl: "https://help.figma.com/hc/en-us/articles/360040314193",
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
      explanation:
        "Usability testing mengamati pengguna nyata menyelesaikan tugas pada desain, lalu hasilnya dipakai untuk iterasi perbaikan.",
      codeExample:
        "# Skenario uji sederhana\n1. Minta pengguna mendaftar akun\n2. Amati langkah yang membingungkan\n3. Catat waktu & kendala\n4. Perbaiki desain",
      referenceUrl: "https://www.nngroup.com/articles/usability-testing-101/",
      points: [
        "Menyusun skenario pengujian",
        "Mengamati perilaku pengguna",
        "Iterasi desain dari hasil pengujian",
      ],
    },
  ],
};

/**
 * Learning Path English.
 *
 * Id materi (english-1..english-5) sengaja dipertahankan dan hanya
 * konten/judulnya yang diperbarui agar progres pengguna lama tidak reset.
 * Materi Bahasa Inggris tidak memakai `codeExample`; konten bahasa
 * (contoh kalimat, vocabulary, latihan) ada di bidang `english` dan
 * dirender khusus oleh halaman Learning Path.
 */
const englishPath: LearningPath = {
  skillId: "english",
  skillName: "English",
  subtitle: "Jalur belajar pemula",
  level: "Pemula",
  icon: "english",
  materials: [
    {
      id: "english-1",
      title: "Basic Vocabulary",
      description: "Kata-kata dasar untuk kebutuhan sehari-hari",
      explanation:
        "Kosakata adalah fondasi belajar bahasa Inggris. Mulai dari kata yang paling sering digunakan sehari-hari seperti anggota keluarga, benda di rumah, dan aktivitas rutin. Catat setiap kata baru beserta contoh kalimatnya agar mudah diingat.",
      referenceUrl:
        "https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2",
      points: [
        "Kata-kata yang paling sering digunakan sehari-hari",
        "Mencatat kosakata baru beserta maknanya",
        "Menyusun kalimat pendek dengan kata baru",
      ],
      english: {
        vocabulary: [
          { word: "family", meaning: "keluarga" },
          { word: "house", meaning: "rumah" },
          { word: "teacher", meaning: "guru" },
          { word: "water", meaning: "air" },
          { word: "friend", meaning: "teman" },
          { word: "morning", meaning: "pagi" },
        ],
        exercises: [
          {
            type: "choice",
            question: "Apa arti kata \"book\" dalam bahasa Indonesia?",
            options: ["Buku", "Kotak", "Tas", "Kertas"],
            correctIndex: 0,
            explanation:
              "Book berarti buku. Kotak = box, tas = bag, dan kertas = paper.",
          },
          {
            type: "fill",
            question: "Lengkapi kalimat: I drink ___ every morning. (air)",
            answer: "water",
            explanation: "\"Air\" dalam bahasa Inggris adalah \"water\".",
          },
        ],
      },
    },
    {
      id: "english-2",
      title: "Simple Present Tense",
      description: "Menyatakan kebiasaan dan fakta",
      explanation:
        "Simple present tense dipakai untuk kebiasaan dan pernyataan yang berlaku umum (S + V1). Untuk subjek he, she, dan it, kata kerja ditambah -s atau -es. Kalimat negatif dan pertanyaan memakai do/does.",
      referenceUrl:
        "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/present-simple",
      points: [
        "Pola kalimat positif dengan S + V1",
        "Menggunakan do/does untuk pertanyaan",
        "Menggunakan do not/does not untuk negatif",
      ],
      english: {
        examples: [
          { sentence: "I go to school every day.", translation: "Saya pergi ke sekolah setiap hari." },
          { sentence: "She studies English at home.", translation: "Dia (perempuan) belajar bahasa Inggris di rumah." },
          { sentence: "Does he like coffee?", translation: "Apakah dia (laki-laki) suka kopi?" },
        ],
        exercises: [
          {
            type: "choice",
            question: "Manakah kalimat simple present yang benar?",
            options: [
              "He play football every Saturday.",
              "He plays football every Saturday.",
              "He playing football every Saturday.",
              "He to play football every Saturday.",
            ],
            correctIndex: 1,
            explanation:
              "Untuk subjek he/she/it, kata kerja mendapat akhiran -s: he plays.",
          },
          {
            type: "fill",
            question: "Lengkapi kalimat: My father ___ (work) in a bank.",
            answer: "works",
            explanation:
              "Subjek \"my father\" = he, jadi kata kerja mendapat akhiran -s: works.",
          },
        ],
      },
    },
    {
      id: "english-3",
      title: "Pronouns & To Be",
      description: "Kata ganti dan penggunaan am, is, are",
      explanation:
        "Kata ganti (pronouns) menggantikan kata benda agar tidak berulang: I, you, he, she, it, we, they. Setiap kata ganti berpasangan dengan to be: I am, you/we/they are, he/she/it is.",
      referenceUrl:
        "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/present-simple-be",
      points: [
        "Kata ganti I, you, he, she, it, we, they",
        "Penggunaan am, is, dan are",
        "Memasangkan kata ganti dengan to be",
      ],
      english: {
        examples: [
          { sentence: "I am a student.", translation: "Saya seorang pelajar." },
          { sentence: "They are my friends.", translation: "Mereka teman-teman saya." },
          { sentence: "Is she your sister?", translation: "Apakah dia saudaramu (perempuan)?" },
        ],
        vocabulary: [
          { word: "I", meaning: "saya" },
          { word: "you", meaning: "kamu / kalian" },
          { word: "he", meaning: "dia (laki-laki)" },
          { word: "she", meaning: "dia (perempuan)" },
          { word: "it", meaning: "dia (benda atau hewan)" },
          { word: "we", meaning: "kita" },
          { word: "they", meaning: "mereka" },
        ],
        exercises: [
          {
            type: "choice",
            question: "Lengkapi kalimat: ___ very happy today.",
            options: ["She is", "She are", "She am", "She be"],
            correctIndex: 0,
            explanation:
              "Kata ganti she (dia perempuan) berpasangan dengan is: She is very happy today.",
          },
          {
            type: "fill",
            question: "Lengkapi kalimat: We ___ classmates.",
            answer: "are",
            explanation:
              "Kata ganti we selalu berpasangan dengan are: We are classmates.",
          },
        ],
      },
    },
    {
      id: "english-4",
      title: "Daily Conversation",
      description: "Sapaan dan percakapan umum sehari-hari",
      explanation:
        "Percakapan harian dimulai dari sapaan dan kalimat sopan. Gunakan \"Excuse me\" untuk memulai, \"please\" saat meminta, dan \"thank you\" untuk berterima kasih.",
      referenceUrl:
        "https://learnenglish.britishcouncil.org/free-resources/speaking/a1/meeting-new-people",
      points: [
        "Sapaan dan perkenalan diri dengan sopan",
        "Bertanya arah, harga, dan kebutuhan dasar",
        "Frasa yang sering dipakai dalam percakapan umum",
      ],
      english: {
        examples: [
          { sentence: "Good morning! How are you?", translation: "Selamat pagi! Apa kabar?" },
          { sentence: "Excuse me, where is the bus stop?", translation: "Permisi, di mana halte bus?" },
          { sentence: "How much is it?", translation: "Berapa harganya?" },
          { sentence: "Could I have the menu, please?", translation: "Boleh saya minta menunya?" },
          { sentence: "Thank you. You're welcome.", translation: "Terima kasih. Sama-sama." },
        ],
        exercises: [
          {
            type: "choice",
            question: "Kamu ingin menanyakan harga. Kalimat yang tepat adalah...",
            options: [
              "How much is it?",
              "Where much is it?",
              "What cost is it?",
              "How many price?",
            ],
            correctIndex: 0,
            explanation: "\"How much is it?\" adalah cara sopan menanyakan harga sesuatu.",
          },
          {
            type: "fill",
            question: "Lengkapi kalimat: Excuse me, ___ is the hospital? (di mana)",
            answer: "where",
            explanation:
              "\"Di mana\" dalam bahasa Inggris adalah \"where\".",
          },
        ],
      },
    },
    {
      id: "english-5",
      title: "Reading Practice",
      description: "Membaca teks pendek dan memahami isinya",
      explanation:
        "Mulai dengan teks pendek tentang kehidupan sehari-hari. Baca perlahan, tandai kata yang belum kamu pahami, lalu jawab pertanyaan pemahaman untuk menguji pembacaanmu.",
      referenceUrl:
        "https://learnenglish.britishcouncil.org/free-resources/reading/a1",
      points: [
        "Membaca teks pendek sehari-hari (A1)",
        "Menemukan informasi penting dari teks",
        "Menjawab pertanyaan pemahaman bacaan",
      ],
      english: {
        examples: [
          {
            sentence:
              "Andi gets up at six. He has breakfast and goes to school by bicycle.",
            translation:
              "Andi bangun jam enam. Dia sarapan dan pergi ke sekolah naik sepeda.",
          },
        ],
        exercises: [
          {
            type: "choice",
            question: "What time does Andi get up?",
            options: ["At six o'clock", "At seven o'clock", "At noon", "At midnight"],
            correctIndex: 0,
            explanation: "Teks membaca: \"Andi gets up at six.\"",
          },
          {
            type: "fill",
            question: "Lengkapi kalimat: Andi goes to school ___ bicycle. (naik sepeda)",
            answer: "by",
            explanation:
              "\"Naik sepeda\" = \"by bicycle\"; gunakan \"by\" untuk menyatakan cara pergi.",
          },
        ],
      },
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
