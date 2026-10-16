/* E2E verifikasi halaman Learning Path (Detail Skill) via Chrome headless.
 * Catatan web: scene tab non-aktif tetap ada di DOM (z-index), jadi seleksi
 * elemen wajib diuji dengan elementFromPoint agar klik mengenai scene fokus. */
const puppeteer = require("puppeteer-core");

const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LONG = 240000;
const SHORT = 25000;

const results = [];
const failures = [];
const consoleErrors = [];

function check(name, ok, extra = "") {
  results.push(`${ok ? "PASS" : "FAIL"} - ${name}${extra ? ` (${extra})` : ""}`);
  if (!ok) failures.push(name);
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${extra ? ` :: ${extra}` : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const urlPath = (page) => new URL(page.url()).pathname;

/** Extractor teks scene Learning Path (mengabaikan scene tab lain yang ikut terender). */
const LP_EXTRACT = () => {
  let best = null;
  for (const el of document.querySelectorAll("*")) {
    const s = el.innerText || "";
    if (!s.includes("Jalur belajar pemula")) continue;
    if (s.includes("Selamat pagi") || s.includes("Jelajahi Skill")) continue;
    if (!best || s.length > best.length) best = s;
  }
  return best === null ? document.body.innerText : best;
};

async function lpText(page) {
  return page.evaluate(LP_EXTRACT);
}

async function waitForLp(page, text, timeout = SHORT) {
  await page.waitForFunction(
    (t) => {
      let best = null;
      for (const el of document.querySelectorAll("*")) {
        const s = el.innerText || "";
        if (!s.includes("Jalur belajar pemula")) continue;
        if (s.includes("Selamat pagi") || s.includes("Jelajahi Skill")) continue;
        if (!best || s.length > best.length) best = s;
      }
      return (best || "").includes(t);
    },
    { timeout },
    text,
  );
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function waitForText(page, text, timeout = SHORT) {
  await page.waitForFunction(
    (t) => document.body.innerText.includes(t),
    { timeout },
    text,
  );
}

/**
 * Klik teks terlihat: kandidat harus benar-benar elemen teratas di titik
 * tengahnya (elementFromPoint), lalu tunggu kondisi `done` — ulang bila perlu.
 */
async function clickUntil(page, text, done, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const handle = await page.evaluateHandle((t) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const matches = [];
      for (const el of document.querySelectorAll("*")) {
        if ((el.innerText || "").trim() !== t) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        matches.push(el);
      }
      matches.sort((a, b) => a.innerText.length - b.innerText.length);
      for (const el of matches) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (cx < 1 || cy < 1 || cx > vw - 1 || cy > vh - 1) continue;
        const hit = document.elementFromPoint(cx, cy);
        if (hit && (hit === el || el.contains(hit))) return el;
      }
      return null;
    }, text);
    const el = handle.asElement();
    if (el) {
      const box = await el.boundingBox().catch(() => null);
      if (box) {
        try {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        } catch (e) { /* retry */ }
        try {
          await page.waitForFunction(done.fn, { timeout: 6000 }, ...done.args);
          return true;
        } catch (e) { /* retry */ }
      }
    }
    await sleep(900);
  }
  return false;
}

/** Warna properti dari elemen teks terlihat; last = elemen terdalam/terakhir. */
async function styleOfText(page, text, prop, last = true) {
  return page.evaluate(({ t, p, useLast }) => {
    const matches = [];
    for (const el of document.querySelectorAll("*")) {
      if ((el.innerText || "").trim() !== t) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      matches.push(el);
    }
    if (!matches.length) return null;
    const el = useLast ? matches[matches.length - 1] : matches[0];
    return getComputedStyle(el)[p];
  }, { t: text, p: prop, useLast: last });
}

/** Background dari ancestor role=button yang memuat teks tsb. */
async function rowBg(page, text) {
  return page.evaluate((t) => {
    const matches = [];
    for (const el of document.querySelectorAll("*")) {
      if ((el.innerText || "").trim() !== t) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      matches.push(el);
    }
    if (!matches.length) return null;
    let el = matches[matches.length - 1];
    while (el && el !== document.body) {
      const role = el.getAttribute("role");
      if (role === "button" || el.tagName === "BUTTON") {
        return getComputedStyle(el).backgroundColor;
      }
      el = el.parentElement;
    }
    return null;
  }, text);
}

/** Opacity efektif: cari ancestor pertama yang opacity-nya < 1 (dari teks ke atas). */
async function effectiveOpacity(page, text) {
  return page.evaluate((t) => {
    const matches = [];
    for (const el of document.querySelectorAll("*")) {
      if ((el.innerText || "").trim() !== t) continue;
      matches.push(el);
    }
    if (!matches.length) return null;
    let el = matches[matches.length - 1];
    while (el && el !== document.body) {
      const op = parseFloat(getComputedStyle(el).opacity);
      if (!Number.isNaN(op) && op < 1) return op;
      el = el.parentElement;
    }
    return 1;
  }, text);
}

/** Klik panah kembali (aria-label), fallback koordinat panah kiri-atas. */
async function clickBack(page, expectPath) {
  try {
    await page.click('[aria-label="Kembali"]', { timeout: 3000 });
  } catch (e) { /* fallback di bawah */ }
  await sleep(1800);
  if ((await urlPath(page)).includes(expectPath)) return true;
  await page.mouse.click(36, 46);
  await sleep(1800);
  return (await urlPath(page)).includes(expectPath);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    protocolTimeout: 300000,
    args: ["--disable-gpu", "--no-sandbox"],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
  });

  const pctInLp = (pct) => {
    // fungsional di dalam page: skop ke scene Learning Path saja
    return `(() => {
      let best = null;
      for (const el of document.querySelectorAll("*")) {
        const s = el.innerText || "";
        if (!s.includes("Jalur belajar pemula")) continue;
        if (s.includes("Selamat pagi") || s.includes("Jelajahi Skill")) continue;
        if (!best || s.length > best.length) best = s;
      }
      return (best || "").includes(${JSON.stringify(pct)});
    })()`;
  };

  try {
    // --- 1. Dashboard terbuka ---
    console.log(">> load dashboard");
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: LONG });
    await waitForText(page, "Selamat pagi", LONG);
    check("Dashboard terbuka", true);
    await sleep(3000);

    // --- 2. Tab Explore ---
    const toExplore = await clickUntil(page, "Explore", {
      fn: "() => location.pathname === '/explore'",
      args: [],
    }, 4);
    check("Bisa klik tab Explore", toExplore, await urlPath(page));
    await waitForText(page, "Jelajahi Skill", SHORT);
    await sleep(3000);
    const exploreTabColor = await styleOfText(page, "Explore", "color");
    check("Tab Explore aktif (biru)", exploreTabColor === "rgb(40, 85, 244)", String(exploreTabColor));

    // --- 3. Kartu HTML -> Learning Path ---
    const toLearningPath = await clickUntil(page, "HTML", {
      fn: "() => location.pathname.includes('/learning-path')",
      args: [],
    }, 5);
    await sleep(2000);
    check(
      "Kartu HTML di Explore membuka Learning Path",
      toLearningPath && (await urlPath(page)).includes("/learning-path"),
      await urlPath(page),
    );
    await waitForLp(page, "Jalur belajar pemula", SHORT);
    check("Halaman Learning Path terender", true);

    // --- 4. Kondisi awal 0% ---
    let text = await lpText(page);
    check("Progress awal 0%", text.includes("0%"));
    check("0 dari 5 materi selesai", text.includes("0 dari 5 materi selesai"));
    check("Judul header Learning Path", text.includes("Learning Path"));
    check("Badge Pemula", text.includes("Pemula"));
    for (const title of ["Pengenalan HTML", "Heading & Paragraf", "Link dan Gambar", "Form HTML", "Tabel dan List"]) {
      check(`Materi "${title}" tampil`, text.includes(title));
    }
    check("Tombol Tandai Selesai ada", text.includes("Tandai Selesai"));
    check('Tidak ada tulisan "(tabs)"', !text.includes("(tabs)"));

    for (const tab of ["Home", "Explore", "Progress", "Profil"]) {
      check(`Bottom nav "${tab}" tampil`, (await bodyText(page)).includes(tab));
    }
    const progressColor = await styleOfText(page, "Progress", "color");
    const homeColor = await styleOfText(page, "Home", "color");
    check("Tab Progress aktif (biru)", progressColor === "rgb(40, 85, 244)", String(progressColor));
    check("Tab Home tidak aktif (keabu-abuan)", homeColor === "rgb(143, 163, 189)", String(homeColor));

    // Materi terkunci tidak bisa dibuka
    const urlBefore = await urlPath(page);
    await clickUntil(page, "Form HTML", {
      fn: `() => location.pathname.includes('/learning-path') && ${pctInLp("0%")}`,
      args: [],
    }, 1);
    await sleep(1200);
    check("Materi terkunci (Form HTML) tidak bisa dibuka", (await urlPath(page)) === urlBefore, await urlPath(page));

    await page.screenshot({ path: "shot-initial-0.png", fullPage: true });

    // --- 5. Materi aktif bisa dibuka ---
    const openedDetail = await clickUntil(page, "Pengenalan HTML", {
      fn: "() => location.pathname.includes('/material-detail')",
      args: [],
    }, 4);
    check("Materi aktif membuka detail materi", openedDetail, await urlPath(page));
    if (openedDetail) {
      await waitForText(page, "Detail Materi", SHORT);
      text = await bodyText(page);
      check("Isi detail materi benar", text.includes("Apa itu HTML dan fungsinya"));
      const backToLp = await clickBack(page, "/learning-path");
      check("Kembali dari detail materi ke Learning Path", backToLp, await urlPath(page));
      await waitForLp(page, "Tandai Selesai", SHORT);
    }

    // --- 6. Tandai selesai -> 20% ---
    const done20 = await clickUntil(page, "Tandai Selesai", {
      fn: `() => ${pctInLp("20%")}`,
      args: [],
    }, 4);
    text = await lpText(page);
    check("Progress jadi 20% setelah 1 materi selesai", done20 && text.includes("20%"), text.match(/\d+%/g)?.join(","));
    check("1 dari 5 materi selesai", text.includes("1 dari 5 materi selesai"));
    const row2Bg = await rowBg(page, "Heading & Paragraf");
    check("Materi 2 menjadi aktif (background #1D3557)", row2Bg === "rgb(29, 53, 87)", String(row2Bg));
    const row2Color = await styleOfText(page, "Heading & Paragraf", "color");
    check("Materi 2 tidak lagi terkunci", row2Color === "rgb(245, 247, 255)", String(row2Color));
    await page.screenshot({ path: "shot-20.png", fullPage: true });

    // --- 7. Reload -> progres tersimpan ---
    await page.reload({ waitUntil: "domcontentloaded", timeout: LONG });
    await waitForLp(page, "20%", LONG);
    text = await lpText(page);
    check("Progress tersimpan setelah reload (20%)", text.includes("20%") && text.includes("1 dari 5 materi selesai"));
    await sleep(1500);

    // --- 8. Sisanya sampai 100% ---
    for (const pct of ["40%", "60%", "80%", "100%"]) {
      const ok = await clickUntil(page, "Tandai Selesai", {
        fn: `() => ${pctInLp(pct)}`,
        args: [],
      }, 4);
      const cur = await lpText(page);
      check(`Progress ${pct}`, ok, cur.match(/\d+%/g)?.join(","));
      await sleep(700);
    }
    text = await lpText(page);
    check("5 dari 5 materi selesai", text.includes("5 dari 5 materi selesai"));
    check("Status learning path selesai tampil", text.includes("Learning Path telah selesai"));
    const btnOpacity = await effectiveOpacity(page, "Tandai Selesai");
    check("Tombol dinonaktifkan setelah 100%", Number(btnOpacity) < 1, `opacity=${btnOpacity}`);
    await page.screenshot({ path: "shot-final-100.png", fullPage: true });

    // --- 9. Tombol kembali -> halaman sebelumnya (Explore) ---
    const backToExplore = await clickBack(page, "/explore");
    await sleep(1500);
    text = await bodyText(page);
    check("Tombol kembali ke halaman sebelumnya (Explore)", backToExplore && text.includes("Jelajahi Skill"), await urlPath(page));
    const exploreActiveNow = await styleOfText(page, "Explore", "color");
    check("Setelah kembali, tab Explore kembali aktif", exploreActiveNow === "rgb(40, 85, 244)", String(exploreActiveNow));
  } catch (err) {
    check("Tidak ada exception tak terduga", false, err.message);
  } finally {
    const realErrors = consoleErrors.filter(
      (e) => !/favicon|WebSocket|HMR|Download the React DevTools/i.test(e),
    );
    check("Tidak ada error JavaScript di console", realErrors.length === 0, realErrors.slice(0, 5).join(" | "));
    console.log("\n==== RINGKASAN ====");
    console.log(results.join("\n"));
    console.log(`\n${failures.length === 0 ? "SEMUA TEST LULUS" : `${failures.length} GAGAL: ${failures.join("; ")}`}`);
    await browser.close();
    process.exit(failures.length === 0 ? 0 : 1);
  }
})();
