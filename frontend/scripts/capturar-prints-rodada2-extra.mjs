import { chromium } from "playwright";
import path from "path";

const outDir = path.resolve("C:/Users/Andrea/Desktop/TG/prints");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://localhost:5173/espaco/1", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("#dt-data-rotulo").scrollIntoViewIfNeeded();
await page.locator("#dt-data-rotulo").click();
await page.locator("#dt-cal-painel .dt-cal-dia:not([disabled])").last().click();
await page.waitForTimeout(1500);
console.log("data", await page.locator("#dt-data-rotulo").innerText());
console.log("periodos", await page.locator(".dt-periodo").count());
console.log("preco", await page.locator(".dt-preco").first().innerText().catch(() => ""));
await page.locator(".dt-reserva, .dt-preco").first().scrollIntoViewIfNeeded().catch(() => {});
await page.screenshot({ path: path.join(outDir, "r2-04b-simulacao-preco.png") });

const home = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await home.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await home.locator("footer.hm-rodape").scrollIntoViewIfNeeded();
await home.waitForTimeout(400);
await home.screenshot({ path: path.join(outDir, "r2-01-rodape-home.png") });
const cel = await browser.newPage({ viewport: { width: 390, height: 844 } });
await cel.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await cel.locator("footer.hm-rodape").scrollIntoViewIfNeeded();
await cel.waitForTimeout(400);
await cel.screenshot({ path: path.join(outDir, "r2-16-rodape-celular.png") });

const aceite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await aceite.goto("http://localhost:5173/aceitar-termos?tipo=LOCATARIO", { waitUntil: "networkidle" });
await aceite.waitForTimeout(800);
await aceite.evaluate(() => {
    const trocar = (texto) =>
        texto.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "usuario.demo@locafesta.exemplo");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nos = [];
    while (walker.nextNode()) nos.push(walker.currentNode);
    for (const no of nos) {
        if (no.nodeValue && no.nodeValue.includes("@")) no.nodeValue = trocar(no.nodeValue);
    }
});
const botao = await aceite.getByRole("button", { name: "Aceitar e continuar" }).boundingBox();
const texto = await aceite.locator(".termos-texto").innerText().catch(() => "");
console.log("botao", JSON.stringify(botao), "visivel", Boolean(botao && botao.y + botao.height <= 900));
console.log("tem Pix", texto.includes("por Pix"), "prospectivo", texto.includes("Quando o pagamento estiver em operação"));
await aceite.screenshot({ path: path.join(outDir, "r2-07-aceitar-termos.png") });

await browser.close();
