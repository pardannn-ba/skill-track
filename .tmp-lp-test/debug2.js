const puppeteer = require("puppeteer-core");
const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function path(page) { return new URL(page.url()).pathname; }

/** Klik teks dengan retry; elemen bisa saja detached karena re-render React. */
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
        console.log(`   clicked "${text}" at ${Math.round(box.x)},${Math.round(box.y)} (try ${i + 1})`);
        return true;
      }
    } catch (e) { /* retry */ }
    await sleep(600);
  }
  console.log(`   could not click "${text}"`);
  return false;
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

  console.log("== klik tab Explore ==");
  await clickTextRetry(page, "Explore");
  await sleep(2500);
  console.log("path:", await path(page));

  console.log("== daftar elemen terlihat ber-teks 'HTML' ==");
  const htmlEls = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      if (el.offsetParent === null) continue;
      if ((el.innerText || "").trim() !== "HTML") continue;
      const r = el.getBoundingClientRect();
      out.push({ tag: el.tagName, cls: String(el.className).slice(0, 60), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] });
    }
    return out;
  });
  console.log(JSON.stringify(htmlEls, null, 1));

  console.log("== klik kartu HTML ==");
  await clickTextRetry(page, "HTML");
  await sleep(4000);
  console.log("path setelah klik HTML:", await path(page));
  console.log("text:", (await page.evaluate(() => document.body.innerText)).slice(0, 250).replace(/\n/g, " | "));

  console.log("== sanity: klik kartu CSS (route biasa /skill-detail) ==");
  await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await sleep(2500);
  await clickTextRetry(page, "CSS");
  await sleep(3000);
  console.log("path setelah klik CSS:", await path(page));

  await browser.close();
})();
