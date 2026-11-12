import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve("C:/Users/Andrea/Desktop/TG/prints");
const log = [];
fs.mkdirSync(outDir, { recursive: true });

function anotar(msg) {
    console.log(msg);
    log.push(msg);
}

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
    }).catch(() => {});
}

async function tiro(page, nome) {
    await page.waitForTimeout(600);
    await mascarar(page);
    await page.screenshot({ path: path.join(outDir, nome) });
    anotar("print " + nome);
}

const browser = await chromium.launch({ headless: true });

async function pagina(w, h) {
    return browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
}

const desk = await pagina(1280, 900);
desk.setDefaultTimeout(12000);

await desk.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await desk.waitForTimeout(1200);
await desk.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await desk.waitForTimeout(400);
await tiro(desk, "r2-01-rodape-home.png");

await desk.evaluate(() => window.scrollTo(0, 0));
await desk.getByRole("button", { name: "Onde" }).click();
await desk.locator("#hm-onde-input").fill("Campina Grande");
await desk.getByRole("button", { name: /Campina Grande/i }).first().click();
await desk.getByRole("button", { name: "Quando" }).click();
const dia = desk.locator("button.hm-cal-dia:not([disabled])").last();
await dia.click();
await desk.locator("button.hm-pessoas-chip").filter({ hasText: /^50$/ }).click();
await desk.locator("button.hm-pill-buscar").click();
await desk.waitForTimeout(800);
await desk.getByRole("button", { name: "Filtros" }).click();
await desk.waitForTimeout(500);
await tiro(desk, "r2-02-busca-filtros.png");
await desk.getByRole("button", { name: "Fechar filtros" }).click().catch(() => {});
await desk.keyboard.press("Escape");

await desk.getByRole("radio", { name: "Mapa" }).click();
await desk.waitForSelector(".leaflet-container", { timeout: 15000 }).catch(() => {});
await desk.waitForTimeout(2500);
const marcadores = await desk.locator(".leaflet-marker-icon").count().catch(() => 0);
anotar("mapa marcadores=" + marcadores);
await tiro(desk, "r2-03-mapa.png");

await desk.goto("http://localhost:5173/espaco/1", { waitUntil: "networkidle" });
await desk.waitForTimeout(1000);
const hero = await desk.evaluate(() => ({
    classe: document.querySelector(".dt-hero")?.className || "",
    fotos: document.querySelectorAll(".dt-hero-foto").length,
    esmaece: document.querySelectorAll(".dt-hero-foto--mais, .dt-hero-mais-veil").length,
}));
anotar("galeria " + JSON.stringify(hero));
try {
    await desk.locator("#dt-data-rotulo").click({ timeout: 4000 });
    await desk.locator("#dt-cal-painel .dt-cal-dia:not([disabled])").last().click({ timeout: 4000 });
    await desk.waitForTimeout(1200);
    const periodo = desk.locator("fieldset.dt-periodos .dt-periodo").first();
    if (await periodo.count()) await periodo.click();
    await desk.waitForTimeout(400);
} catch (e) {
    anotar("simulacao de preco incompleta: " + e.message.split("\n")[0]);
}
await tiro(desk, "r2-04-espaco-galeria-preco.png");

const cel = await pagina(390, 844);
await cel.goto("http://localhost:5173/espaco/1", { waitUntil: "networkidle" });
await cel.waitForTimeout(1000);
await tiro(cel, "r2-05-espaco-celular.png");
await cel.close();

await desk.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
await desk.getByRole("button", { name: "Cadastre-se" }).click();
await desk.waitForTimeout(400);
await tiro(desk, "r2-06-cadastro.png");

await desk.goto("http://localhost:5173/aceitar-termos", { waitUntil: "networkidle" });
await desk.waitForTimeout(800);
const botao = await desk.getByRole("button", { name: "Aceitar e continuar" }).boundingBox();
const noViewport = Boolean(botao && botao.y >= 0 && botao.y + botao.height <= 900);
anotar("aceitar-termos botao=" + JSON.stringify(botao) + " visivelSemRolar=" + noViewport);
await tiro(desk, "r2-07-aceitar-termos.png");

const painel = await pagina(1280, 900);
await painel.goto("http://localhost:5173/dev/painel-locador?secao=painel", { waitUntil: "networkidle" });
await painel.waitForTimeout(2000);
await tiro(painel, "r2-08-painel.png");
await painel.getByRole("button", { name: "Avisos" }).click().catch(() => {});
await painel.waitForTimeout(500);
await tiro(painel, "r2-09-notificacoes.png");
await painel.close();

const fin = await pagina(1280, 900);
await fin.goto("http://localhost:5173/dev/painel-locador?secao=financeiro", { waitUntil: "networkidle" });
await fin.waitForTimeout(2000);
await tiro(fin, "r2-10-financeiro-mes.png");
await fin.getByRole("button", { name: "6 meses" }).click();
await fin.waitForTimeout(1200);
await tiro(fin, "r2-11-financeiro-6-meses.png");
await fin.close();

const reservas = await pagina(1280, 900);
await reservas.goto("http://localhost:5173/dev/painel-locador?secao=reservas", { waitUntil: "networkidle" });
await reservas.waitForTimeout(1800);
await tiro(reservas, "r2-12-reservas-locador.png");
await reservas.close();

const docs = await pagina(1280, 900);
await docs.goto("http://localhost:5173/dev/documentos-espaco?id=1", { waitUntil: "networkidle" });
await docs.waitForTimeout(1800);
await tiro(docs, "r2-13-documentos-espaco.png");
await docs.close();

const termos = await pagina(1280, 900);
await termos.goto("http://localhost:5173/dev/termos?view=historico&tipo=LOCATARIO", { waitUntil: "networkidle" });
await termos.waitForTimeout(1500);
await tiro(termos, "r2-14-admin-termos.png");
await termos.close();

await desk.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await desk.getByRole("button", { name: "Onde" }).click();
await desk.locator("#hm-onde-input").fill("Cidade Inexistente XYZ");
await desk.locator("button.hm-pill-buscar").click();
await desk.waitForTimeout(800);
await tiro(desk, "r2-15-estado-vazio.png");

const celHome = await pagina(390, 844);
await celHome.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
await celHome.waitForTimeout(1000);
await celHome.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await tiro(celHome, "r2-16-rodape-celular.png");
await celHome.close();

try {
    const pref = await desk.evaluate(async () => {
        const res = await fetch("http://localhost:8080/api/v1/pagamentos/criar-preferencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reservaId: 99,
                nomeEspaco: "Local A",
                valorTotal: 1100,
            }),
        });
        const texto = await res.text();
        return { status: res.status, texto: texto.slice(0, 500) };
    });
    anotar("preferencia status=" + pref.status + " corpo=" + pref.texto.replace(/\s+/g, " ").slice(0, 280));
    const json = JSON.parse(pref.texto);
    if (json.initPoint) {
        const pag = await pagina(1280, 900);
        await pag.goto(json.initPoint, { waitUntil: "domcontentloaded", timeout: 30000 });
        await pag.waitForTimeout(3000);
        await tiro(pag, "r2-17-checkout-teste.png");
        await pag.close();
    }
} catch (e) {
    anotar("checkout nao aberto: " + e.message);
}

await desk.close();
await browser.close();
fs.writeFileSync(path.join(outDir, "r2-evidencias.txt"), log.join("\n"), "utf8");
anotar("fim");
