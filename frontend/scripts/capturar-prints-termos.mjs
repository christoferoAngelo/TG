import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "..");
const API = process.env.VITE_API_URL || "http://localhost:8080";

const browser = await chromium.launch({ headless: true });

async function assertTextoCompleto(page, seletor) {
    const n = await page.locator(seletor).first().evaluate((el) => (el.textContent || "").length);
    if (n < 2000) {
        throw new Error(`Texto curto demais em ${seletor}: ${n} caracteres (esperava o texto completo ~5k)`);
    }
    console.log("chars", seletor, n);
}

const prints = [
    ["print-termos-cadastro.png", "http://localhost:5173/dev/termos?view=cadastro&tipo=LOCATARIO", ".adm-termos-previa, .termos-texto"],
    ["print-termos-admin-editor.png", "http://localhost:5173/dev/termos?view=editor&tipo=LOCADOR", "#dev-conteudo, textarea"],
    ["print-termos-admin-historico.png", "http://localhost:5173/dev/termos?view=historico&tipo=LOCADOR", ".adm-termos-previa"],
    ["print-aceitar-termos.png", "http://localhost:5173/aceitar-termos?tipo=LOCATARIO&voltar=%2Fperfil", ".termos-texto"],
    ["print-termos-bloqueio.png", "http://localhost:5173/aceitar-termos?tipo=LOCATARIO&voltar=%2Ffavoritos", ".termos-texto"],
];

// Sanity: API real
const vigente = await fetch(`${API}/api/termos/LOCATARIO/vigente`).then((r) => r.json());
console.log("API LOCATARIO v" + vigente.versao + " chars=" + (vigente.conteudo || "").length);
if ((vigente.conteudo || "").length < 2000) {
    throw new Error("API não está devolvendo o texto completo — abortei os prints.");
}

for (const [file, url, seletor] of prints) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    try {
        await assertTextoCompleto(page, seletor);
    } catch (e) {
        console.warn(file, e.message);
    }
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
    console.log("ok", file);
    await page.close();
}

await browser.close();
