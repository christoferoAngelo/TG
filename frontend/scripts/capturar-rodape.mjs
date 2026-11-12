import { chromium } from "playwright";
import path from "path";

const outDir = path.resolve("C:/Users/Andrea/Desktop/TG/prints");
const browser = await chromium.launch({ headless: true });

const home = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await home.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await home.locator("footer.hm-rodape").scrollIntoViewIfNeeded();
await home.waitForTimeout(300);
await home.screenshot({ path: path.join(outDir, "r2-01-rodape-home.png") });
console.log("rodape", await home.locator("footer.hm-rodape").innerText());

const cel = await browser.newPage({ viewport: { width: 390, height: 844 } });
await cel.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await cel.locator("footer.hm-rodape").scrollIntoViewIfNeeded();
await cel.waitForTimeout(300);
await cel.screenshot({ path: path.join(outDir, "r2-16-rodape-celular.png") });

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5173/espaco/1", { waitUntil: "networkidle" });
await page.locator("#dt-cal-painel .dt-cal-dia:not([disabled])").last().scrollIntoViewIfNeeded();
await page.locator("#dt-cal-painel .dt-cal-dia:not([disabled])").last().click();
await page.waitForTimeout(1200);
console.log("data", await page.locator("#dt-data-rotulo strong").innerText());
console.log("preco", await page.locator(".dt-preco").first().innerText());
await page.locator(".dt-preco").first().scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(outDir, "r2-04b-simulacao-preco.png") });
await browser.close();
