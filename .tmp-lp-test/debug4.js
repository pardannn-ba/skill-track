const puppeteer = require("puppeteer-core");
const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text) {
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
  if (!el) return false;
  const box = await el.boundingBox();
  if (!box) return false;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  return true;
}

async function probe(page) {
  return page.evaluate(() => {
    const visible = (el) => el.offsetParent !== null;
    let lpCount = 0, lpVisible = 0, exploreVisible = 0;
    for (const el of document.querySelectorAll("*")) {
      const t = el.innerText || "";
      if (t.includes("Jalur belajar pemula")) { lpCount++; if (visible(el)) lpVisible++; }
      if ((t || "").trim() === "Jelajahi Skill" && visible(el)) exploreVisible++;
    }
    return { pathname: location.pathname, lpCount, lpVisible, exploreVisible, historyLen: history.length };
  });
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

  await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Jelajahi Skill"), { timeout: 240000 });
  await sleep(2000);
  console.log("start:", JSON.stringify(await probe(page)));

  for (let attempt = 1; attempt <= 4; attempt++) {
    const clicked = await clickText(page, "HTML");
    await sleep(3500);
    const p = await probe(page);
    console.log(`attempt ${attempt} (clicked=${clicked}):`, JSON.stringify(p));
    if (p.pathname === "/learning-path" && p.lpVisible > 0) break;
  }

  await page.screenshot({ path: "debug4-final.png", fullPage: false });
  console.log("body:", (await page.evaluate(() => document.body.innerText)).slice(0, 220).replace(/\n/g, " | "));
  await browser.close();
})();
