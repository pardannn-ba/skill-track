const puppeteer = require("puppeteer-core");
const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function state(page, label) {
  const s = await page.evaluate(() => ({
    path: location.pathname,
    histLen: history.length,
    histState: (() => { try { return JSON.stringify(history.state).slice(0, 120); } catch (e) { return "n/a"; } })(),
  }));
  console.log(`${label}: path=${s.path} histLen=${s.histLen} state=${s.histState}`);
  return s;
}

async function clickUntil(page, text, doneFn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const handle = await page.evaluateHandle((t) => {
      const vw = window.innerWidth, vh = window.innerHeight;
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
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
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
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
        try {
          await page.waitForFunction(doneFn, { timeout: 5000 });
          return true;
        } catch (e) { /* retry */ }
      }
    }
    await sleep(800);
  }
  return false;
}

async function clickBackOnce(page) {
  const info = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Kembali"]');
    if (!btn) return { found: false };
    const r = btn.getBoundingClientRect();
    return { found: true, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
  });
  console.log("  back button:", JSON.stringify(info));
  if (info.found) {
    await page.mouse.click(info.box[0] + info.box[2] / 2, info.box[1] + info.box[3] / 2).catch((e) => console.log("  click err:", e.message));
  }
  await sleep(2500);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    protocolTimeout: 300000,
    args: ["--disable-gpu", "--no-sandbox"],
    defaultViewport: { width: 390, height: 844 },
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  console.log("=== ALUR NORMAL (tanpa reload) ===");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Selamat pagi"), { timeout: 240000 });
  await state(page, "start");
  await clickUntil(page, "Explore", "() => location.pathname === '/explore'");
  await sleep(2500);
  await state(page, "after tab Explore");
  await clickUntil(page, "HTML", "() => location.pathname.includes('/learning-path')");
  await sleep(2500);
  await state(page, "after kartu HTML");
  await clickBackOnce(page);
  await state(page, "after back (1)");

  console.log("=== ALUR DENGAN RELOAD ===");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Selamat pagi"), { timeout: 240000 });
  await clickUntil(page, "Explore", "() => location.pathname === '/explore'");
  await sleep(2500);
  await clickUntil(page, "HTML", "() => location.pathname.includes('/learning-path')");
  await sleep(2500);
  await state(page, "before reload");
  await page.reload({ waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Tandai Selesai"), { timeout: 240000 });
  await sleep(3000);
  await state(page, "after reload");
  await clickBackOnce(page);
  await state(page, "after back (1)");
  await clickBackOnce(page);
  await state(page, "after back (2)");

  await browser.close();
})();
