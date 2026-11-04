import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "..");

const browser = await chromium.launch({ headless: true });

const prints = [
    ["print-termos-cadastro.png", "http://localhost:5173/dev/termos?view=cadastro&tipo=LOCATARIO"],
    ["print-termos-admin-editor.png", "http://localhost:5173/dev/termos?view=editor&tipo=LOCADOR"],
    ["print-termos-admin-historico.png", "http://localhost:5173/dev/termos?view=historico&tipo=LOCADOR"],
];

for (const [file, url] of prints) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    const dest = path.join(outDir, file);
    await page.screenshot({ path: dest, fullPage: false });
    console.log("ok", dest);
    await page.close();
}

await browser.close();
