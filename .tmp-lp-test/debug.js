const puppeteer = require("puppeteer-core");
const BASE = "http://127.0.0.1:8123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function clickText(page, text) {
  const handle = await page.evaluateHandle((t) => {
    const all = document.querySelectorAll("*");
    let best = null;
    for (const el of all) {
      if (el.offsetParent === null) continue;
      if ((el.innerText || "").trim() !== t) continue;
      if (!best || el.innerText.length < best.innerText.length) best = el;
    }
    return best;
  }, text);
  const el = handle.asElement();
  if (!el) { console.log("   element not found:", text); return false; }
  const box = await el.boundingBox();
  console.log("   box:", JSON.stringify(box));
  try { await el.click({ timeout: 5000 }); return true; }
  catch (e) { console.log("   click failed:", e.message); return false; }
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

  console.log("== A. buka /learning-path langsung ==");
  await page.goto(`${BASE}/learning-path`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await new Promise((r) => setTimeout(r, 8000));
  console.log("path:", new URL(page.url()).pathname);
  console.log("text:", (await page.evaluate(() => document.body.innerText)).slice(0, 400).replace(/\n/g, " | "));

  console.log("== B. alur klik dari dashboard ==");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.waitForFunction(() => document.body.innerText.includes("Selamat pagi"), { timeout: 240000 });
  await clickText(page, "Explore");
  await new Promise((r) => setTimeout(r, 2500));
  console.log("after explore:", new URL(page.url()).pathname, "|", (await page.evaluate(() => document.body.innerText)).slice(0, 150).replace(/\n/g, " | "));
  await clickText(page, "HTML");
  await new Promise((r) => setTimeout(r, 5000));
  console.log("after HTML click:", new URL(page.url()).pathname, "|", (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\n/g, " | "));

  await browser.close();
})();
