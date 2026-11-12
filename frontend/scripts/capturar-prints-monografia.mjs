import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve("C:/Users/Andrea/Desktop/TG/prints");
fs.mkdirSync(outDir, { recursive: true });

async function mascarar(page) {
    await page.evaluate(() => {
        const trocar = (texto) =>
            texto.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "usuario.demo@locafesta.exemplo");
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nos = [];
        while (walker.nextNode()) nos.push(walker.currentNode);
        for (const no of nos) {
            if (no.nodeValue && no.nodeValue.includes("@")) no.nodeValue = trocar(no.nodeValue);
        }
    });
}

async function tiro(page, nome, { full = false } = {}) {
    await page.waitForTimeout(700);
    await mascarar(page);
    const dest = path.join(outDir, nome);
    await page.screenshot({ path: dest, fullPage: full });
    console.log("ok", nome);
}

const browser = await chromium.launch({ headless: true });

async function pagina(w, h) {
    const page = await browser.newPage({
        viewport: { width: w, height: h },
        deviceScaleFactor: 1,
    });
    return page;
}

const desk = await pagina(1280, 900);
await desk.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await desk.waitForTimeout(1500);
await tiro(desk, "01-home-visitante.png");

const busca = desk.locator("input, [placeholder]").first();
await desk.locator("text=Onde").first().click().catch(() => {});
await desk.waitForTimeout(400);
await tiro(desk, "02-home-busca.png");

await desk.keyboard.press("Escape");
await desk.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /mapa/i.test(b.textContent || ""));
    btn?.click();
});
await desk.waitForTimeout(800);
await tiro(desk, "03-home-mapa.png");

await desk.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await desk.waitForTimeout(600);
await tiro(desk, "04-home-rodape.png");

await desk.goto("http://localhost:5173/espaco/1", { waitUntil: "networkidle" });
await desk.waitForTimeout(1500);
await tiro(desk, "05-espaco-simulacao.png");

await desk.goto("http://localhost:5173/sobre", { waitUntil: "networkidle" });
await desk.waitForTimeout(800);
await tiro(desk, "06-sobre-desktop.png", { full: true });

await desk.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
await desk.waitForTimeout(800);
await tiro(desk, "07-login.png");
await desk.close();

const cel = await pagina(390, 844);
await cel.goto("http://localhost:5173/sobre", { waitUntil: "networkidle" });
await cel.waitForTimeout(800);
await tiro(cel, "08-sobre-celular.png", { full: true });
await cel.close();

const secoes = [
    ["09-locador-painel.png", "painel"],
    ["10-locador-reservas.png", "reservas"],
    ["11-locador-espacos.png", "espacos"],
    ["12-locador-financeiro.png", "financeiro"],
];
for (const [arquivo, secao] of secoes) {
    const page = await pagina(1280, 900);
    await page.goto(`http://localhost:5173/dev/painel-locador?secao=${secao}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    await tiro(page, arquivo);
    await page.close();
}

const celLoc = [
    ["13-locador-painel-celular.png", "painel"],
    ["14-locador-reservas-celular.png", "reservas"],
    ["15-locador-espacos-celular.png", "espacos"],
    ["16-locador-financeiro-celular.png", "financeiro"],
];
for (const [arquivo, secao] of celLoc) {
    const page = await pagina(390, 844);
    await page.goto(`http://localhost:5173/dev/painel-locador?secao=${secao}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    await tiro(page, arquivo);
    await page.close();
}

for (const [arquivo, view] of [
    ["17-admin-termos-historico.png", "historico"],
    ["18-admin-termos-editor.png", "editor"],
    ["19-aceite-termos.png", "aceitar"],
]) {
    const page = await pagina(1280, 900);
    await page.goto(`http://localhost:5173/dev/termos?view=${view}&tipo=LOCATARIO`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await tiro(page, arquivo);
    await page.close();
}

await browser.close();
console.log("fim", outDir);
