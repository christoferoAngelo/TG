import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { formatarData, formatarHora, formatarMoeda } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorPainel.css";

const API = "http://localhost:8080/api";
const CORES_STATUS = {
    PENDENTE: "#B7791F", // âmbar escuro — contraste melhor no creme
    APROVADA: "#2f9e44",
    REJEITADA: "#c92a2a",
    CANCELADA: "#868e96",
};
const COR_BARRAS = "#C9952A"; // paleta única para gráficos de procura / ranking

function temSerieUtil(dados) {
    const nums = (dados || []).map((v) => Number(v) || 0);
    return nums.length >= 2 && nums.some((v) => v > 0);
}

function Sparkline({ dados, cor = "var(--color-primary)", ariaLabel }) {
    if (!temSerieUtil(dados)) return null;
    const pontos = dados.map((v, i) => ({ i, v: Number(v) || 0 }));
    return (
        <div className="lc-spark" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height={36}>
                <AreaChart data={pontos} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <Area type="monotone" dataKey="v" stroke={cor} fill={cor} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function plural(n, um, varios) {
    return `${n} ${n === 1 ? um : varios}`;
}

function SkeletonPainel() {
    return (
        <div className="lc-painel-skel" aria-busy="true" aria-label="Carregando painel">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="lc-skel-bloco" />
            ))}
        </div>
    );
}

export default function LocadorPainel() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();
    const outlet = useOutletContext() || {};
    const setPendentesNav = outlet.setPendentes;
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [periodoFat, setPeriodoFat] = useState(6);

    const carregar = useCallback(() => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);
        setErro("");
        fetch(`${API}/locador/painel/resumo`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Não foi possível carregar o painel.");
                return res.json();
            })
            .then((json) => {
                setDados(json);
                if (typeof setPendentesNav === "function") {
                    setPendentesNav(Number(json?.kpis?.pedidosAguardando) || 0);
                }
            })
            .catch((e) => {
                setDados(null);
                setErro(e.message);
            })
            .finally(() => setCarregando(false));
    }, [usuarioLogado?.id, setPendentesNav]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const serieFat = useMemo(() => {
        const lista = dados?.faturamentoMensal || [];
        return lista.slice(-periodoFat);
    }, [dados, periodoFat]);

    const pizza = useMemo(() => {
        return (dados?.reservasPorStatus || []).map((s) => ({
            ...s,
            name: s.rotulo,
            value: Number(s.quantidade) || 0,
            fill: CORES_STATUS[s.status] || "#adb5bd",
        }));
    }, [dados]);

    const aprovar = async (id) => {
        const res = await fetch(`${API}/reservas/${id}/aprovar`, {
            method: "PATCH",
            headers: { "Usuario-Id": usuarioLogado.id },
        });
        if (!res.ok) {
            alert((await res.text()) || "Falha ao aprovar.");
            return;
        }
        carregar();
    };

    const rejeitar = async (id) => {
        if (!window.confirm("Recusar este pedido? A data será liberada e não haverá cobrança.")) return;
        const res = await fetch(`${API}/reservas/${id}/rejeitar`, {
            method: "PATCH",
            headers: { "Usuario-Id": usuarioLogado.id },
        });
        if (!res.ok) {
            alert((await res.text()) || "Falha ao recusar.");
            return;
        }
        carregar();
    };

    if (carregando) {
        return (
            <div className="lc-painel">
                <header className="lc-topo">
                    <div>
                        <h1 className="lc-titulo">Painel</h1>
                        <p className="lc-subtitulo">O que precisa de ação e como anda o negócio.</p>
                    </div>
                </header>
                <SkeletonPainel />
            </div>
        );
    }

    if (erro) {
        return (
            <div className="lc-painel">
                <header className="lc-topo">
                    <div>
                        <h1 className="lc-titulo">Painel</h1>
                        <p className="lc-subtitulo">O que precisa de ação e como anda o negócio.</p>
                    </div>
                </header>
                <section className="lc-card lc-estado-erro" role="alert">
                    <p>{erro}</p>
                    <button type="button" className="lc-btn lc-btn--primary" onClick={carregar}>
                        Tentar novamente
                    </button>
                </section>
            </div>
        );
    }

    const kpis = dados?.kpis || {};
    const contadores = dados?.contadoresAnuncios || {};
    const temDados =
        (dados?.reservasPorStatus || []).some((s) => s.quantidade > 0)
        || (dados?.faturamentoMensal || []).some((p) => Number(p.valor) > 0)
        || (dados?.pedidosParaResponder || []).length > 0;

    return (
        <div className="lc-painel">
            <header className="lc-topo">
                <div>
                    <h1 className="lc-titulo">Painel</h1>
                    <p className="lc-subtitulo">Pedidos, faturamento e próximos eventos em um só lugar.</p>
                </div>
                <button
                    type="button"
                    className="lc-btn lc-btn--primary lc-btn--lg"
                    onClick={() => navigate("/locador/espacos/novo")}
                >
                    + Novo anúncio
                </button>
            </header>

            {(dados?.alertas || []).length > 0 && (
                <section className="lc-alertas" aria-label="Alertas">
                    {dados.alertas.map((alerta, i) => (
                        <Link key={`${alerta.tipo}-${i}`} to={alerta.link || "/locador"} className="lc-alerta">
                            <strong>{alerta.titulo}</strong>
                            <span>{alerta.mensagem}</span>
                        </Link>
                    ))}
                </section>
            )}

            <section className="lc-kpi-grid" aria-label="Resumo">
                <button
                    type="button"
                    className={`lc-kpi${(kpis.pedidosAguardando ?? 0) > 0 ? " lc-kpi--destaque" : ""}`}
                    onClick={() => navigate("/locador/reservas?status=PENDENTE")}
                >
                    <span className="lc-kpi-label">Pedidos aguardando</span>
                    <strong className="lc-kpi-valor">{kpis.pedidosAguardando ?? 0}</strong>
                    <Sparkline dados={kpis.sparklinePedidos} ariaLabel="Tendência de pedidos pendentes" />
                </button>
                <button type="button" className="lc-kpi" onClick={() => navigate("/locador/financeiro")}>
                    <span className="lc-kpi-label">Faturamento do mês</span>
                    <strong className="lc-kpi-valor">{formatarMoeda(kpis.faturamentoMes)}</strong>
                    <span className={`lc-kpi-var${(kpis.variacaoPercentual ?? 0) >= 0 ? " is-up" : " is-down"}`}>
                        {kpis.variacaoPercentual == null
                            ? "Sem base no mês anterior"
                            : `${kpis.variacaoPercentual >= 0 ? "↑" : "↓"} ${Math.abs(kpis.variacaoPercentual)}% vs mês anterior`}
                    </span>
                    <Sparkline dados={kpis.sparklineFaturamento} ariaLabel="Tendência de faturamento" />
                </button>
                <button type="button" className="lc-kpi" onClick={() => navigate("/locador/financeiro")}>
                    <span className="lc-kpi-label">A receber</span>
                    <strong className="lc-kpi-valor">{formatarMoeda(kpis.aReceber)}</strong>
                    <span className="lc-kpi-dica">Reservas confirmadas ainda sem pagamento liberado</span>
                    <Sparkline dados={kpis.sparklineAReceber} cor="#c45a2a" ariaLabel="Tendência a receber" />
                </button>
                <button
                    type="button"
                    className="lc-kpi"
                    onClick={() => navigate("/locador/reservas?status=APROVADA")}
                    disabled={!kpis.proximoEvento}
                >
                    <span className="lc-kpi-label">Próximo evento</span>
                    {kpis.proximoEvento ? (
                        <>
                            <strong className="lc-kpi-valor lc-kpi-valor--sm">{formatarData(kpis.proximoEvento.dataEvento)}</strong>
                            <span className="lc-kpi-dica">
                                {kpis.proximoEvento.espacoTitulo} · {kpis.proximoEvento.locatarioNome}
                            </span>
                        </>
                    ) : (
                        <strong className="lc-kpi-valor lc-kpi-valor--sm">Nenhum</strong>
                    )}
                </button>
            </section>

            <section className="lc-atalho-espacos" aria-label="Meus espaços">
                <div className="lc-atalho-espacos-info">
                    <strong>Meus espaços</strong>
                    <div className="lc-atalho-chips">
                        <Link to="/locador/espacos" className="lc-atalho-chip">
                            {plural(contadores.cadastrados ?? 0, "cadastrado", "cadastrados")}
                        </Link>
                        <Link to="/locador/espacos?filtro=aprovados" className="lc-atalho-chip">
                            {plural(contadores.aprovados ?? 0, "aprovado", "aprovados")}
                        </Link>
                        <Link to="/locador/espacos?filtro=analise" className="lc-atalho-chip">
                            {plural(contadores.emAnalise ?? 0, "em análise", "em análise")}
                        </Link>
                    </div>
                </div>
                <Link to="/locador/espacos" className="lc-btn lc-btn--ghost">
                    Gerenciar
                </Link>
            </section>

            {!temDados ? (
                <section className="lc-card lc-vazio-ilustrado" aria-label="Sem dados ainda">
                    <div className="lc-fantasma" aria-hidden="true">
                        <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={[{ i: 0, v: 2 }, { i: 1, v: 4 }, { i: 2, v: 3 }, { i: 3, v: 6 }, { i: 4, v: 5 }]}>
                                <Area type="monotone" dataKey="v" stroke="#d0cbc3" fill="#efeae3" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <h2>Tudo em dia — ainda sem movimento</h2>
                    <p>Quando chegarem reservas, os gráficos de faturamento e situação aparecem aqui.</p>
                    <button type="button" className="lc-btn lc-btn--primary" onClick={() => navigate("/locador/espacos/novo")}>
                        Criar novo anúncio
                    </button>
                </section>
            ) : (
                <>
                    <section className="lc-card" aria-labelledby="lc-fat-titulo">
                        <div className="lc-card-cab">
                            <h2 id="lc-fat-titulo" className="lc-card-titulo">Faturamento</h2>
                            <div className="lc-seg" role="group" aria-label="Período do gráfico">
                                {[
                                    { v: 1, t: "30 dias" },
                                    { v: 6, t: "6 meses" },
                                    { v: 12, t: "12 meses" },
                                ].map((op) => (
                                    <button
                                        key={op.v}
                                        type="button"
                                        className={`lc-seg-btn${periodoFat === op.v ? " is-ativo" : ""}`}
                                        onClick={() => setPeriodoFat(op.v)}
                                    >
                                        {op.t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="lc-chart" role="img" aria-label="Gráfico de faturamento mensal">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={serieFat} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                                    <defs>
                                        <linearGradient id="lcFatFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FECB5A" stopOpacity={0.55} />
                                            <stop offset="100%" stopColor="#FECB5A" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis
                                        dataKey="rotulo"
                                        tick={{ fontSize: 13, fill: "var(--color-text-secondary)" }}
                                        tickMargin={10}
                                        height={40}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 13, fill: "var(--color-text-secondary)" }}
                                        tickFormatter={(v) => {
                                            const n = Number(v) || 0;
                                            if (n >= 1000) {
                                                const mil = n / 1000;
                                                return `R$ ${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
                                            }
                                            return `R$ ${n.toLocaleString("pt-BR")}`;
                                        }}
                                        width={78}
                                        tickCount={4}
                                        allowDecimals={false}
                                        tickMargin={6}
                                    />
                                    <Tooltip
                                        formatter={(valor) => [formatarMoeda(valor), "Faturamento"]}
                                        labelFormatter={(l) => `Período: ${l}`}
                                    />
                                    <Area type="monotone" dataKey="valor" stroke={COR_BARRAS} fill="url(#lcFatFill)" strokeWidth={2} name="Faturamento" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <div className="lc-charts-2">
                        <section className="lc-card" aria-labelledby="lc-pizza-titulo">
                            <h2 id="lc-pizza-titulo" className="lc-card-titulo">Reservas por situação</h2>
                            <div className="lc-chart" role="img" aria-label="Gráfico de reservas por status">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={pizza} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                                            {pizza.map((entrada) => (
                                                <Cell key={entrada.status} fill={entrada.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [`${v}`, n]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="lc-legend-toggle" role="group" aria-label="Situações — clique para abrir Reservas filtradas">
                                {(dados?.reservasPorStatus || []).map((s) => (
                                    <button
                                        key={s.status}
                                        type="button"
                                        className="lc-chip"
                                        onClick={() => navigate(`/locador/reservas?status=${s.status}`)}
                                    >
                                        <span className="lc-chip-dot" style={{ background: CORES_STATUS[s.status] }} />
                                        {s.rotulo} ({s.quantidade})
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="lc-card" aria-labelledby="lc-rank-titulo">
                            <h2 id="lc-rank-titulo" className="lc-card-titulo">Espaços mais alugados</h2>
                            {(dados?.espacosMaisAlugados || []).length === 0 ? (
                                <p className="lc-vazio">Ainda sem reservas aprovadas para ranking.</p>
                            ) : (dados?.espacosMaisAlugados || []).length < 2 ? (
                                <ul className="lc-rank-lista" aria-label="Espaço mais alugado">
                                    {dados.espacosMaisAlugados.map((e) => (
                                        <li key={e.espacoId} className="lc-rank-card">
                                            <strong>{e.titulo}</strong>
                                            <span>
                                                {e.reservas === 1 ? "1 reserva" : `${e.reservas} reservas`}
                                                {" · "}
                                                {formatarMoeda(e.faturamento)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="lc-chart" role="img" aria-label="Ranking de espaços">
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart
                                            layout="vertical"
                                            data={dados.espacosMaisAlugados}
                                            margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13 }} />
                                            <YAxis type="category" dataKey="titulo" width={100} tick={{ fontSize: 13 }} />
                                            <Tooltip
                                                formatter={(v, _n, item) => [
                                                    `${v} reservas · ${formatarMoeda(item?.payload?.faturamento)}`,
                                                    "Total",
                                                ]}
                                            />
                                            <Bar dataKey="reservas" fill={COR_BARRAS} radius={[0, 6, 6, 0]} name="Reservas" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="lc-charts-2">
                        <section className="lc-card" aria-labelledby="lc-mes-titulo">
                            <h2 id="lc-mes-titulo" className="lc-card-titulo">Períodos de maior procura (mês)</h2>
                            <div className="lc-chart" role="img" aria-label="Procura por mês">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dados?.procuraPorMes || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 13 }} tickCount={4} />
                                        <Tooltip />
                                        <Bar dataKey="quantidade" fill={COR_BARRAS} radius={[6, 6, 0, 0]} name="Pedidos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                        <section className="lc-card" aria-labelledby="lc-dia-titulo">
                            <h2 id="lc-dia-titulo" className="lc-card-titulo">Procura por dia da semana</h2>
                            <div className="lc-chart" role="img" aria-label="Procura por dia da semana">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dados?.procuraPorDiaSemana || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="rotulo" tick={{ fontSize: 13 }} />
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

            <div className="lc-charts-2">
                <section className="lc-card" aria-labelledby="lc-pedidos-titulo">
                    <div className="lc-card-cab">
                        <h2 id="lc-pedidos-titulo" className="lc-card-titulo">Pedidos para responder agora</h2>
                        <Link to="/locador/reservas?status=PENDENTE" className="lc-link">Ver todos</Link>
                    </div>
                    {(dados?.pedidosParaResponder || []).length === 0 ? (
                        <p className="lc-vazio">Nenhum pedido aguardando. Tudo em dia!</p>
                    ) : (
                        <ul className="lc-lista-acao">
                            {dados.pedidosParaResponder.map((p) => (
                                <li key={p.id} className="lc-lista-acao-item">
                                    <div>
                                        <strong>{p.espacoTitulo}</strong>
                                        <span>
                                            {p.locatarioNome} · {formatarData(p.dataEvento)}
                                            {p.horaInicio ? ` · ${formatarHora(p.horaInicio)}` : ""}
                                            {" · "}
                                            {formatarMoeda(p.valorTotal)}
                                        </span>
                                    </div>
                                    <div className="lc-pedido-acoes">
                                        <button type="button" className="lc-btn lc-btn--success" onClick={() => aprovar(p.id)}>
                                            Aprovar
                                        </button>
                                        <button type="button" className="lc-btn lc-btn--danger-ghost" onClick={() => rejeitar(p.id)}>
                                            Recusar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="lc-card" aria-labelledby="lc-prox-titulo">
                    <div className="lc-card-cab">
                        <h2 id="lc-prox-titulo" className="lc-card-titulo">Próximos eventos</h2>
                        <Link to="/locador/reservas?status=APROVADA" className="lc-link">Ver agenda</Link>
                    </div>
                    {(dados?.proximosEventos || []).length === 0 ? (
                        <p className="lc-vazio">Nenhum evento confirmado nos próximos dias.</p>
                    ) : (
                        <ul className="lc-lista-acao">
                            {dados.proximosEventos.map((e) => (
                                <li key={e.reservaId} className="lc-lista-acao-item">
                                    <div>
                                        <strong>{formatarData(e.dataEvento)} · {e.espacoTitulo}</strong>
                                        <span>
                                            {e.locatarioNome}
                                            {e.horaInicio ? ` · ${formatarHora(e.horaInicio)}${e.horaFim ? `–${formatarHora(e.horaFim)}` : ""}` : ""}
                                            {" · "}
                                            {formatarMoeda(e.valorTotal)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
