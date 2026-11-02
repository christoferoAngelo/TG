import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "..");

const shots = [
    { secao: "reservas", file: "print-reservas-tabela.png", w: 1280, h: 900 },
    { secao: "espacos", file: "print-meus-espacos.png", w: 1280, h: 900 },
    { secao: "financeiro", file: "print-financeiro.png", w: 1280, h: 900 },
];

const browser = await chromium.launch({ headless: true });

for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
    const url = `http://localhost:5173/dev/painel-locador?secao=${shot.secao}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const dest = path.join(outDir, shot.file);
    await page.screenshot({ path: dest, fullPage: false });
    console.log("ok", dest);
    await page.close();
}

// Preview celular: abre o 1º espaço do Locador A com ?preview=1 e força viewport mobile na UI
const preview = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await preview.goto("http://localhost:5173/dev/painel-locador?secao=espacos", { waitUntil: "networkidle" });
await preview.waitForTimeout(2000);
const href = await preview.evaluate(async () => {
    const r = await fetch("http://localhost:8080/api/users/dZ1lkQfXTZXfiio36x1Vg2s8nGi1");
    const u = await r.json();
    const e = await fetch(`http://localhost:8080/api/locadores/${u.id}/espacos`);
    const lista = await e.json();
    return lista[0] ? `/espaco/${lista[0].id}?preview=1` : null;
});
if (href) {
    // Sem Firebase: injeta Auth mínimo via localStorage não basta; usa page com cookie fake?
    // Abre direto e seta header via route? DetalhesEspaco precisa AuthContext.
    // Fallback: navega na SPA real após stub — para print, usamos evaluate no preview route.
}
await preview.close();

await browser.close();
