import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { formatarData, formatarEixoReais, formatarMoeda, pluralReservas } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorPainel.css";
import "./LocadorFinanceiro.css";

const API = "http://localhost:8080/api";
const COR_BRUTO = "#C9952A";
const COR_LIQUIDO = "#5C7C4A";

function mesCorrenteIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function serieComMesEmAndamento(pontos) {
    const atual = mesCorrenteIso();
    return (pontos || []).map((p) => ({
        ...p,
        rotulo: p.chave === atual ? `${p.rotulo}*` : p.rotulo,
        emAndamento: p.chave === atual,
    }));
}

const PERIODOS = [
    { id: "mes", rotulo: "Este mês" },
    { id: "anterior", rotulo: "Mês anterior" },
    { id: "3m", rotulo: "3 meses" },
    { id: "6m", rotulo: "6 meses" },
    { id: "12m", rotulo: "12 meses" },
];

function isoLocal(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function intervaloDoPeriodo(id) {
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    let de = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    let ate = fimDoMes;

    if (id === "anterior") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        ate = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    } else if (id === "3m") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    } else if (id === "6m") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    } else if (id === "12m") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
    }
    return { de: isoLocal(de), ate: isoLocal(ate) };
}

function textoVariacao(item) {
    if (!item || !item.disponivel) {
        return item?.mensagem || "sem base de comparação";
    }
    const n = Number(item.percentual);
    const seta = n >= 0 ? "↑" : "↓";
    return `${seta} ${Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs período anterior`;
}

function classeVariacao(item) {
    if (!item?.disponivel) return "lc-kpi-var is-neutro";
    return Number(item.percentual) >= 0 ? "lc-kpi-var is-up" : "lc-kpi-var is-down";
}

function SkeletonFin() {
    return (
        <div className="lc-painel-skel" aria-busy="true" aria-label="Carregando financeiro">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="lc-skel-bloco" />
            ))}
        </div>
    );
}

export default function LocadorFinanceiro() {
    const { usuarioLogado } = useAuth();
    const [periodo, setPeriodo] = useState("mes");
    const [espacoId, setEspacoId] = useState("");
    const [pagina, setPagina] = useState(0);
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const { de, ate } = useMemo(() => intervaloDoPeriodo(periodo), [periodo]);

    const carregar = useCallback(() => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);
        setErro("");
        const params = new URLSearchParams({ de, ate, pagina: String(pagina), tamanho: "10" });
        if (espacoId) params.set("espacoId", espacoId);
        fetch(`${API}/locador/financeiro?${params}`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Não foi possível carregar o financeiro.");
                return res.json();
            })
            .then(setDados)
            .catch((e) => {
                setDados(null);
                setErro(e.message);
            })
            .finally(() => setCarregando(false));
    }, [usuarioLogado?.id, de, ate, espacoId, pagina]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    useEffect(() => {
        setPagina(0);
    }, [periodo, espacoId]);

    const kpis = dados?.kpis || {};
    const variacao = dados?.variacao || {};
    const pctComissao = dados?.percentualComissao != null ? Number(dados.percentualComissao) : null;
    const rotuloComissao =
        pctComissao != null && !Number.isNaN(pctComissao)
            ? `Comissão da plataforma (${pctComissao.toLocaleString("pt-BR")}%)`
            : "Comissão da plataforma";
    const temDados =
        (dados?.totalReservas || 0) > 0 || (dados?.faturamentoMensal || []).some((p) => Number(p.bruto) > 0);
    const serieMensal = useMemo(
        () => serieComMesEmAndamento(dados?.faturamentoMensal),
        [dados?.faturamentoMensal]
    );
    const temMesEmAndamento = serieMensal.some((p) => p.emAndamento);

    return (
        <div className="lc-secao lc-financeiro">
            <header className="lc-topo">
                <div>
                    <h1 className="lc-titulo">Financeiro</h1>
                    <p className="lc-subtitulo">
                        Faturamento estimado das reservas aprovadas
                        {pctComissao != null ? `, comissão de ${pctComissao.toLocaleString("pt-BR")}%` : ""} e
                        valores a receber.
                    </p>
                </div>
            </header>

            <p className="lc-fin-aviso" role="note">
                Valores estimados. O repasse automático ainda não está disponível nesta versão.
            </p>

            <div className="lc-fin-filtros">
                <div className="lc-seg" role="group" aria-label="Período">
                    {PERIODOS.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            className={`lc-seg-btn${periodo === p.id ? " is-ativo" : ""}`}
                            onClick={() => setPeriodo(p.id)}
                        >
                            {p.rotulo}
                        </button>
                    ))}
                </div>
                <label className="lc-fin-espaco">
                    <span>Espaço</span>
                    <select
                        value={espacoId}
                        onChange={(e) => setEspacoId(e.target.value)}
                        aria-label="Filtrar por espaço"
                    >
                        <option value="">Todos os espaços</option>
                        {(dados?.espacosDisponiveis || []).map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.titulo}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {carregando ? (
                <SkeletonFin />
            ) : erro ? (
                <section className="lc-card lc-estado-erro" role="alert">
                    <p>{erro}</p>
                    <button type="button" className="lc-btn lc-btn--primary" onClick={carregar}>
                        Tentar novamente
                    </button>
                </section>
            ) : (
                <>
                    <section className="lc-kpi-grid lc-fin-kpis" aria-label="Indicadores financeiros">
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">Faturamento bruto</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.faturamentoBruto)}</strong>
                            <span className={classeVariacao(variacao.faturamentoBruto)}>
                                {textoVariacao(variacao.faturamentoBruto)}
                            </span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">{rotuloComissao}</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.comissaoPlataforma)}</strong>
                            <span className={classeVariacao(variacao.comissaoPlataforma)}>
                                {textoVariacao(variacao.comissaoPlataforma)}
                            </span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">Valor líquido estimado</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.valorLiquidoEstimado)}</strong>
                            <span className={classeVariacao(variacao.valorLiquidoEstimado)}>
                                {textoVariacao(variacao.valorLiquidoEstimado)}
                            </span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">A receber</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.aReceber)}</strong>
                            <span className={classeVariacao(variacao.aReceber)}>
                                {textoVariacao(variacao.aReceber)}
                            </span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">Reservas aprovadas</span>
                            <strong className="lc-kpi-valor">{kpis.quantidadeReservas ?? 0}</strong>
                            <span className={classeVariacao(variacao.quantidadeReservas)}>
                                {textoVariacao(variacao.quantidadeReservas)}
                            </span>
                        </div>
                    </section>

                    {!temDados ? (
                        <section className="lc-card lc-vazio-ilustrado" aria-label="Sem dados no período">
                            <h2>Nenhuma reserva aprovada neste período</h2>
                            <p>Ajuste o filtro de datas ou espaço para ver o faturamento estimado.</p>
                        </section>
                    ) : (
                        <>
                            <section className="lc-card" aria-labelledby="lc-fin-fat">
                                <div className="lc-card-cab">
                                    <h2 id="lc-fin-fat" className="lc-card-titulo">
                                        Faturamento por mês
                                    </h2>
                                </div>
                                <div
                                    className="lc-chart"
                                    role="img"
                                    aria-label="Gráfico de barras com faturamento bruto e líquido estimado por mês"
                                >
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart
                                            data={serieMensal}
                                            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} tickMargin={10} height={40} />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={formatarEixoReais}
                                                width={88}
                                                tickCount={4}
                                                tickMargin={6}
                                            />
                                            <Tooltip
                                                formatter={(valor, nome) => [
                                                    formatarMoeda(valor),
                                                    nome === "bruto" ? "Bruto" : "Líquido estimado",
                                                ]}
                                                labelFormatter={(rotulo, payload) => {
                                                    const item = payload?.[0]?.payload;
                                                    return item?.emAndamento
                                                        ? `${rotulo.replace(/\*$/, "")} (mês em andamento)`
                                                        : rotulo;
                                                }}
                                            />
                                            <Legend
                                                formatter={(value) =>
                                                    value === "bruto" ? "Bruto" : "Líquido estimado"
                                                }
                                            />
                                            <Bar dataKey="bruto" fill={COR_BRUTO} radius={[4, 4, 0, 0]} name="bruto" maxBarSize={28} />
                                            <Bar dataKey="liquido" fill={COR_LIQUIDO} radius={[4, 4, 0, 0]} name="liquido" maxBarSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {temMesEmAndamento && (
                                    <p className="lc-fin-nota-mes">* Mês em andamento — o valor ainda pode mudar.</p>
                                )}
                            </section>

                            <div className="lc-charts-2">
                                <section className="lc-card" aria-labelledby="lc-fin-rank">
                                    <h2 id="lc-fin-rank" className="lc-card-titulo">
                                        Espaços mais alugados
                                    </h2>
                                    {(dados.espacosMaisAlugados || []).length < 2 ? (
                                        <ul className="lc-rank-lista">
                                            {(dados.espacosMaisAlugados || []).length === 0 ? (
                                                <li className="lc-vazio">Sem ranking no período.</li>
                                            ) : (
                                                dados.espacosMaisAlugados.map((e) => (
                                                    <li key={e.espacoId} className="lc-rank-card">
                                                        <strong>{e.titulo}</strong>
                                                        <span>
                                                            {pluralReservas(e.reservas)} · {formatarMoeda(e.faturamento)}
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="lc-chart" role="img" aria-label="Ranking de espaços">
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart
                                                    layout="vertical"
                                                    data={dados.espacosMaisAlugados}
                                                    margin={{ left: 8, right: 12 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13 }} />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="titulo"
                                                        width={100}
                                                        tick={{ fontSize: 13 }}
                                                    />
                                                    <Tooltip formatter={(v) => [`${v} reservas`, "Quantidade"]} />
                                                    <Bar dataKey="reservas" fill={COR_BRUTO} radius={[0, 6, 6, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </section>

                                <section className="lc-card" aria-labelledby="lc-fin-procura">
                                    <h2 id="lc-fin-procura" className="lc-card-titulo">
                                        Períodos de maior procura
                                    </h2>
                                    <div className="lc-chart" role="img" aria-label="Procura por mês">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={dados.procuraPorMes || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} tickMargin={8} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} tickCount={4} />
                                                <Tooltip />
                                                <Bar
                                                    dataKey="quantidade"
                                                    fill={COR_BRUTO}
                                                    radius={[6, 6, 0, 0]}
                                                    name="Pedidos"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>
                            </div>

                            <section className="lc-card" aria-labelledby="lc-fin-dia">
                                <h2 id="lc-fin-dia" className="lc-card-titulo">
                                    Procura por dia da semana
                                </h2>
                                <div className="lc-chart" role="img" aria-label="Procura por dia da semana">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={dados.procuraPorDiaSemana || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 13 }} tickCount={4} />
                                            <Tooltip />
                                            <Bar
                                                dataKey="quantidade"
                                                fill={COR_BRUTO}
                                                radius={[6, 6, 0, 0]}
                                                name="Pedidos"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </>
                    )}

                    <section className="lc-card lc-fin-tabela-card" aria-labelledby="lc-fin-lista">
                        <div className="lc-card-cab">
                            <h2 id="lc-fin-lista" className="lc-card-titulo">
                                Reservas aprovadas
                                <span className="lc-card-contador">{dados.totalReservas ?? 0}</span>
                            </h2>
                        </div>

                        {(dados.reservas || []).length === 0 ? (
                            <p className="lc-vazio">Nenhuma reserva aprovada neste filtro.</p>
                        ) : (
                            <>
                                <div className="lc-fin-table-wrap">
                                    <table className="lc-fin-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Espaço</th>
                                                <th>Locatário</th>
                                                <th>Bruto</th>
                                                <th>Comissão</th>
                                                <th>Líquido est.</th>
                                                <th>Pagamento</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dados.reservas.map((r) => (
                                                <tr key={r.id}>
                                                    <td>{formatarData(r.dataEvento)}</td>
                                                    <td>{r.espacoTitulo}</td>
                                                    <td>{r.locatarioNome}</td>
                                                    <td>{formatarMoeda(r.valorBruto)}</td>
                                                    <td>{formatarMoeda(r.comissao)}</td>
                                                    <td>{formatarMoeda(r.liquidoEstimado)}</td>
                                                    <td>
                                                        <span
                                                            className={`lc-fin-pag-status${
                                                                r.pagamentoLiberado ? " is-ok" : " is-pendente"
                                                            }`}
                                                        >
                                                            {r.situacaoPagamento ||
                                                                (r.pagamentoLiberado
                                                                    ? "Pagamento liberado"
                                                                    : "A receber")}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <ul className="lc-fin-cards" aria-label="Reservas em cartões">
                                    {dados.reservas.map((r) => (
                                        <li key={`c-${r.id}`} className="lc-fin-card">
                                            <strong>{r.espacoTitulo}</strong>
                                            <span>
                                                {formatarData(r.dataEvento)} · {r.locatarioNome}
                                            </span>
                                            <span
                                                className={`lc-fin-pag-status${
                                                    r.pagamentoLiberado ? " is-ok" : " is-pendente"
                                                }`}
                                            >
                                                {r.situacaoPagamento ||
                                                    (r.pagamentoLiberado ? "Pagamento liberado" : "A receber")}
                                            </span>
                                            <dl>
                                                <div>
                                                    <dt>Bruto</dt>
                                                    <dd>{formatarMoeda(r.valorBruto)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Comissão</dt>
                                                    <dd>{formatarMoeda(r.comissao)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Líquido est.</dt>
                                                    <dd>{formatarMoeda(r.liquidoEstimado)}</dd>
                                                </div>
                                            </dl>
                                        </li>
                                    ))}
                                </ul>

                                {dados.totalPaginas > 1 && (
                                    <div className="lc-fin-paginacao">
                                        <button
                                            type="button"
                                            className="lc-btn lc-btn--ghost"
                                            disabled={pagina <= 0}
                                            onClick={() => setPagina((p) => Math.max(0, p - 1))}
                                        >
                                            Anterior
                                        </button>
                                        <span>
                                            Página {pagina + 1} de {dados.totalPaginas}
                                        </span>
                                        <button
                                            type="button"
                                            className="lc-btn lc-btn--ghost"
                                            disabled={pagina + 1 >= dados.totalPaginas}
                                            onClick={() => setPagina((p) => p + 1)}
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
