import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(__dirname, "..", "..", "print-modal-pedido.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5173/dev/painel-locador?secao=reservas", {
    waitUntil: "networkidle",
});
await page.waitForTimeout(2200);

const ver = page.locator("button.lc-pedido-ver").first();
if ((await ver.count()) > 0) {
    await ver.click();
} else {
    await page.getByRole("button", { name: /ver detalhes/i }).first().click();
}
await page.waitForTimeout(900);
await page.screenshot({ path: out, fullPage: false });
console.log("ok", out);
await browser.close();
