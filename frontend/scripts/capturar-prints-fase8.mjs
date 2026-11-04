import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "..");

const browser = await chromium.launch({ headless: true });

const secoesMobile = ["painel", "reservas", "espacos", "financeiro"];

for (const secao of secoesMobile) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:5173/dev/painel-locador?secao=${secao}`, {
        waitUntil: "networkidle",
    });
    await page.waitForTimeout(2200);
    const dest = path.join(outDir, `print-mobile-${secao}.png`);
    await page.screenshot({ path: dest, fullPage: false });
    console.log("ok", dest);
    await page.close();
}

// Estados vazios: intercepta APIs e devolve payload vazio
const vazios = [
    {
        file: "print-vazio-painel.png",
        secao: "painel",
        match: /\/api\/locador\/painel\/resumo/,
        body: {
            alertas: [],
            kpis: {
                pedidosAguardando: 0,
                faturamentoMes: 0,
                faturamentoMesAnterior: 0,
                variacaoPercentual: null,
                aReceber: 0,
                proximoEvento: null,
                sparklinePedidos: [],
                sparklineFaturamento: [],
                sparklineAReceber: [],
            },
            contadoresAnuncios: {
                cadastrados: 0,
                aprovados: 0,
                emAnalise: 0,
                rejeitados: 0,
                ativos: 0,
            },
            faturamentoMensal: [],
            reservasPorStatus: [],
            espacosMaisAlugados: [],
            procuraPorMes: [],
            procuraPorDiaSemana: [],
            pedidosParaResponder: [],
            proximosEventos: [],
        },
    },
    {
        file: "print-vazio-reservas.png",
        secao: "reservas",
        match: /\/api\/reservas\/minhas-solicitacoes/,
        body: [],
    },
    {
        file: "print-vazio-espacos.png",
        secao: "espacos",
        match: /\/api\/locadores\/\d+\/espacos/,
        body: [],
    },
    {
        file: "print-vazio-financeiro.png",
        secao: "financeiro",
        match: /\/api\/locador\/financeiro/,
        body: {
            de: "2026-06-01",
            ate: "2026-11-30",
            espacoIdFiltro: null,
            percentualComissao: 10,
            kpis: {
                faturamentoBruto: 0,
                comissaoPlataforma: 0,
                valorLiquidoEstimado: 0,
                aReceber: 0,
                quantidadeReservas: 0,
            },
            variacao: {
                faturamentoBruto: { disponivel: false, percentual: null, mensagem: "sem base de comparação" },
                comissaoPlataforma: { disponivel: false, percentual: null, mensagem: "sem base de comparação" },
                valorLiquidoEstimado: { disponivel: false, percentual: null, mensagem: "sem base de comparação" },
                aReceber: { disponivel: false, percentual: null, mensagem: "sem base de comparação" },
                quantidadeReservas: { disponivel: false, percentual: null, mensagem: "sem base de comparação" },
            },
            faturamentoMensal: [],
            espacosMaisAlugados: [],
            procuraPorMes: [],
            procuraPorDiaSemana: [],
            reservas: [],
            pagina: 0,
            tamanhoPagina: 10,
            totalReservas: 0,
            totalPaginas: 0,
            espacosDisponiveis: [],
        },
    },
];

for (const shot of vazios) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route(shot.match, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(shot.body),
        });
    });
    await page.goto(`http://localhost:5173/dev/painel-locador?secao=${shot.secao}`, {
        waitUntil: "networkidle",
    });
    await page.waitForTimeout(2200);
    const dest = path.join(outDir, shot.file);
    await page.screenshot({ path: dest, fullPage: false });
    console.log("ok", dest);
    await page.close();
}

// Financeiro desktop atualizado (barras)
{
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto("http://localhost:5173/dev/painel-locador?secao=financeiro", {
        waitUntil: "networkidle",
    });
    await page.waitForTimeout(2500);
    const dest = path.join(outDir, "print-financeiro.png");
    await page.screenshot({ path: dest, fullPage: false });
    console.log("ok", dest);
    await page.close();
}

await browser.close();
