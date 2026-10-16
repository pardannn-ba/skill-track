const assert = require("assert");
const lp = require("./out/src/data/learning-path.js");
const m = lp.htmlLearningPath.materials;

const statuses = (done) => m.map((_, i) => lp.getMaterialStatus(m, i, done)).join(",");

// 1. Kondisi awal: 0%, materi 1 aktif, sisanya terkunci
let done = [];
assert.strictEqual(lp.computeProgress(m, done), 0, "awal harus 0%");
assert.strictEqual(lp.countCompleted(m, done), 0);
assert.strictEqual(statuses(done), "active,locked,locked,locked,locked");

// 2. Selesaikan satu per satu: +20% tiap materi, tak ada yang dobel
const expected = [20, 40, 60, 80, 100];
for (let i = 0; i < 5; i++) {
  const next = lp.completeActiveMaterial(m, done);
  assert.strictEqual(next.length, done.length + 1, "materi tak boleh dihitung 2x");
  assert.strictEqual(new Set(next).size, next.length, "tidak boleh ada id duplikat");
  done = next;
  assert.strictEqual(lp.computeProgress(m, done), expected[i], `progress setelah ${i + 1} materi`);
  const expectStatus = ["completed","completed","completed","completed","completed"]
    .map((s, idx) => (idx <= i ? "completed" : "locked"));
  expectStatus[Math.min(i + 1, 4)] = i + 1 <= 4 ? "active" : "completed";
  if (i < 4) expectStatus[i + 1] = "active";
  assert.strictEqual(statuses(done), expectStatus.join(","), `status setelah ${i + 1} selesai`);
}

// 3. Setelah 100%: tak ada lagi yang bisa diselesaikan
assert.strictEqual(lp.getActiveMaterialIndex(m, done), -1);
const frozen = lp.completeActiveMaterial(m, done);
assert.strictEqual(frozen.length, 5, "100% tak boleh menambah materi");
assert.strictEqual(lp.computeProgress(m, frozen), 100);

// 4. Duplikat dari penyimpanan lama tidak menggandakan hitungan
assert.strictEqual(lp.countCompleted(m, [...done, ...done]), 5);
assert.deepStrictEqual(lp.sanitizeCompleted(m, [...done, "html-1", "hapus-ini", 42].filter(v => typeof v === "string")), done);

// 5. Sanitize data korup -> kembali 0% (tidak meledak)
const clean = lp.sanitizeCompleted(m, ["bukan-id", "html-3"]);
assert.deepStrictEqual(clean, ["html-3"], "hanya id valid yang disimpan");

console.log("SEMUA LOGIKA OK");
