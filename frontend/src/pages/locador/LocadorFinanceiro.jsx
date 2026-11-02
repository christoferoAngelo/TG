import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { formatarData, formatarMoeda } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorPainel.css";
import "./LocadorFinanceiro.css";

const API = "http://localhost:8080/api";
const COR_BARRAS = "#C9952A";

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
    const ate = new Date(hoje);
    let de = new Date(hoje);

    if (id === "mes") {
        de = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (id === "anterior") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        ate.setTime(new Date(hoje.getFullYear(), hoje.getMonth(), 0).getTime());
    } else if (id === "3m") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    } else if (id === "6m") {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    } else {
        de = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
    }
    return { de: isoLocal(de), ate: isoLocal(ate) };
}

function eixoReais(v) {
    const n = Number(v) || 0;
    if (n >= 1000) {
        return `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
    }
    return `R$ ${n.toLocaleString("pt-BR")}`;
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
    const [periodo, setPeriodo] = useState("6m");
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
    const temDados = (dados?.totalReservas || 0) > 0 || (dados?.faturamentoMensal || []).some((p) => Number(p.bruto) > 0);

    return (
        <div className="lc-secao lc-financeiro">
            <header className="lc-topo">
                <div>
                    <h1 className="lc-titulo">Financeiro</h1>
                    <p className="lc-subtitulo">
                        Faturamento estimado das reservas aprovadas, comissão de 10% e valores a receber.
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
                            <span className="lc-kpi-dica">Reservas aprovadas no período</span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">Comissão da plataforma (10%)</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.comissaoPlataforma)}</strong>
                            <span className="lc-kpi-dica">Estimativa sobre o bruto</span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">Valor líquido estimado</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.valorLiquidoEstimado)}</strong>
                            <span className="lc-kpi-dica">Bruto menos comissão</span>
                        </div>
                        <div className="lc-kpi">
                            <span className="lc-kpi-label">A receber</span>
                            <strong className="lc-kpi-valor">{formatarMoeda(kpis.aReceber)}</strong>
                            <span className="lc-kpi-dica">
                                {kpis.quantidadeReservas ?? 0} reserva(s) · sem pagamento liberado
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
                                    <h2 id="lc-fin-fat" className="lc-card-titulo">Faturamento por mês</h2>
                                </div>
                                <div className="lc-chart" role="img" aria-label="Gráfico de faturamento mensal">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={dados.faturamentoMensal || []} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                                            <defs>
                                                <linearGradient id="lcFinFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#FECB5A" stopOpacity={0.55} />
                                                    <stop offset="100%" stopColor="#FECB5A" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} tickMargin={10} height={40} />
                                            <YAxis
                                                tick={{ fontSize: 13 }}
                                                tickFormatter={eixoReais}
                                                width={78}
                                                tickCount={4}
                                                tickMargin={6}
                                            />
                                            <Tooltip
                                                formatter={(valor, nome) => [
                                                    formatarMoeda(valor),
                                                    nome === "bruto" ? "Bruto" : "Líquido estimado",
                                                ]}
                                            />
                                            <Area type="monotone" dataKey="bruto" stroke={COR_BARRAS} fill="url(#lcFinFill)" strokeWidth={2} name="bruto" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            <div className="lc-charts-2">
                                <section className="lc-card" aria-labelledby="lc-fin-rank">
                                    <h2 id="lc-fin-rank" className="lc-card-titulo">Espaços mais alugados</h2>
                                    {(dados.espacosMaisAlugados || []).length < 2 ? (
                                        <ul className="lc-rank-lista">
                                            {(dados.espacosMaisAlugados || []).length === 0 ? (
                                                <li className="lc-vazio">Sem ranking no período.</li>
                                            ) : (
                                                dados.espacosMaisAlugados.map((e) => (
                                                    <li key={e.espacoId} className="lc-rank-card">
                                                        <strong>{e.titulo}</strong>
                                                        <span>
                                                            {e.reservas} reserva(s) · {formatarMoeda(e.faturamento)}
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="lc-chart" role="img" aria-label="Ranking de espaços">
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart layout="vertical" data={dados.espacosMaisAlugados} margin={{ left: 8, right: 12 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13 }} />
                                                    <YAxis type="category" dataKey="titulo" width={100} tick={{ fontSize: 13 }} />
                                                    <Tooltip formatter={(v) => [`${v} reservas`, "Quantidade"]} />
                                                    <Bar dataKey="reservas" fill={COR_BARRAS} radius={[0, 6, 6, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </section>

                                <section className="lc-card" aria-labelledby="lc-fin-procura">
                                    <h2 id="lc-fin-procura" className="lc-card-titulo">Períodos de maior procura</h2>
                                    <div className="lc-chart" role="img" aria-label="Procura por mês">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={dados.procuraPorMes || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} tickMargin={8} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} tickCount={4} />
                                                <Tooltip />
                                                <Bar dataKey="quantidade" fill={COR_BARRAS} radius={[6, 6, 0, 0]} name="Pedidos" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>
                            </div>
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
