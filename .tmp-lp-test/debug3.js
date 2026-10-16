const puppeteer = require("puppeteer-core");
const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function path(page) { return new URL(page.url()).pathname; }

async function clickTextRetry(page, text, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const handle = await page.evaluateHandle((t) => {
      const all = document.querySelectorAll("*");
      const matches = [];
      for (const el of all) {
        if (el.offsetParent === null) continue;
        if ((el.innerText || "").trim() !== t) continue;
        matches.push(el);
      }
      matches.sort((a, b) => a.innerText.length - b.innerText.length);
      return matches[0] || null;
    }, text);
    const el = handle.asElement();
    if (!el) { await sleep(600); continue; }
    try {
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log(`   clicked "${text}" at ${Math.round(box.x)},${Math.round(box.y)}`);
        return true;
      }
    } catch (e) { /* retry */ }
    await sleep(600);
  }
  return false;
}

function probe(label) {
  return {
    label,
    /* eslint-disable no-undef */
  };
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
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text()); });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Selamat pagi"), { timeout: 240000 });
  await clickTextRetry(page, "Explore");
  await sleep(2500);
  console.log("path:", await path(page));

  await clickTextRetry(page, "HTML");
  await sleep(6000);

  const report = await page.evaluate(() => {
    const visible = (el) => el.offsetParent !== null;
    const find = (t) => {
      const out = [];
      for (const el of document.querySelectorAll("*")) {
        if ((el.innerText || "").trim() === t) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          out.push({ visible: visible(el), display: cs.display, color: cs.color, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] });
        }
      }
      return out;
    };
    const colorOf = (t) => {
      for (const el of document.querySelectorAll("*")) {
        if (visible(el) && (el.innerText || "").trim() === t) return getComputedStyle(el).color;
      }
      return null;
    };
    return {
      pathname: location.pathname,
      historyLength: history.length,
      hasLearningSubtitleAnyVisibility: (() => {
        let count = 0, visibleCount = 0;
        for (const el of document.querySelectorAll("*")) {
          if ((el.innerText || "").includes("Jalur belajar pemula")) { count++; if (visible(el)) visibleCount++; }
        }
        return { count, visibleCount };
      })(),
      exploreTitle: find("Jelajahi Skill"),
      learningHeader: find("Learning Path"),
      progressTabColor: colorOf("Progress"),
      homeTabColor: colorOf("Home"),
      bodyFirst: document.body.innerText.slice(0, 160).replace(/\n/g, " | "),
    };
  });
  console.log(JSON.stringify(report, null, 1));

  await page.screenshot({ path: "debug3-after-click.png", fullPage: false });

  await browser.close();
})();
