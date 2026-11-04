import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import EspacoItem from "../../components/locador/EspacoItem";
import Counter from "../../components/bits/Counter";
import { statusDe } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorLayout.css";
import "./LocadorEspacos.css";

const API = "http://localhost:8080/api";
const ROTA_NOVO = "/locador/espacos/novo";
const rotaEditar = (id) => `/locador/espacos/${id}/editar`;

function dataIso(valor) {
    if (!valor) return "";
    if (Array.isArray(valor)) {
        const [a, m, d] = valor;
        return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 10);
}

function Stat({ label, valor, dica, alerta, ativo, onClick }) {
    return (
        <button
            type="button"
            className={`lc-stat lc-stat--btn${alerta ? " lc-stat--alerta" : ""}${ativo ? " is-ativo" : ""}`}
            onClick={onClick}
            aria-pressed={ativo}
        >
            <span className="lc-stat-label">{label}</span>
            <strong className="lc-stat-valor">
                <Counter value={Number(valor) || 0} locale="pt-BR" fontSize={30} textColor="var(--color-text)" intro={false} />
            </strong>
            {dica && <span className="lc-stat-dica">{dica}</span>}
        </button>
    );
}

export default function LocadorEspacos() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const filtro = (searchParams.get("filtro") || "").toLowerCase();

    const [espacos, setEspacos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const carregar = () => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);
        setErro("");
        Promise.all([
            fetch(`${API}/locadores/${usuarioLogado.id}/espacos`).then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Não foi possível carregar os espaços.");
                return res.json();
            }),
            fetch(`${API}/reservas/minhas-solicitacoes`, {
                headers: { "Usuario-Id": usuarioLogado.id },
            }).then((res) => (res.ok ? res.json() : [])),
        ])
            .then(([listaEspacos, listaReservas]) => {
                setEspacos(Array.isArray(listaEspacos) ? listaEspacos : []);
                setReservas(Array.isArray(listaReservas) ? listaReservas : []);
            })
            .catch((e) => {
                setEspacos([]);
                setReservas([]);
                setErro(e.message);
            })
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        carregar();
    }, [usuarioLogado?.id]);

    const proximosPorEspaco = useMemo(() => {
        const hoje = new Date();
        const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
        const mapa = {};
        for (const r of reservas) {
            if (statusDe(r.status) !== "APROVADA") continue;
            const eid = r.espaco?.id;
            if (!eid) continue;
            const di = dataIso(r.dataEvento);
            if (!di || di < hojeIso) continue;
            const atual = mapa[eid];
            if (!atual || di < dataIso(atual.dataEvento)) mapa[eid] = r;
        }
        return mapa;
    }, [reservas]);

    const totalAtivos = espacos.filter((e) => e.ativo === true || e.ativo === 1).length;
    const totalAprovados = espacos.filter((e) => statusDe(e.statusAprovacao) === "APROVADO").length;
    const totalEmAnalise = espacos.filter((e) => statusDe(e.statusAprovacao) === "PENDENTE").length;
    const totalRejeitados = espacos.filter((e) => statusDe(e.statusAprovacao) === "REJEITADO").length;

    const filtrados = useMemo(() => {
        if (filtro === "aprovados") {
            return espacos.filter((e) => statusDe(e.statusAprovacao) === "APROVADO");
        }
        if (filtro === "analise") {
            return espacos.filter((e) => statusDe(e.statusAprovacao) === "PENDENTE");
        }
        if (filtro === "rejeitados") {
            return espacos.filter((e) => statusDe(e.statusAprovacao) === "REJEITADO");
        }
        if (filtro === "ativos") {
            return espacos.filter((e) => e.ativo === true || e.ativo === 1);
        }
        if (filtro === "inativos") {
            return espacos.filter((e) => !(e.ativo === true || e.ativo === 1));
        }
        return espacos;
    }, [espacos, filtro]);

    const setFiltro = (valor) => {
        if (!valor || valor === filtro) setSearchParams({});
        else setSearchParams({ filtro: valor });
    };

    const handleAlternarStatus = async (espacoId) => {
        try {
            const response = await fetch(`${API}/locadores/${usuarioLogado.id}/espacos/${espacoId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error((await response.text()) || "Falha ao atualizar o status do espaço.");
            }
            const atualizado = await response.json();
            setEspacos((prev) =>
                prev.map((esp) => {
                    if (esp.id !== espacoId) return esp;
                    const ativo =
                        atualizado?.ativo === true ||
                        atualizado?.ativo === 1 ||
                        atualizado?.ativo === "true";
                    return { ...esp, ...atualizado, ativo };
                })
            );
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    return (
        <div className="lc-secao">
            <header className="lc-topo">
                <div>
                    <h1 className="lc-titulo">Meus espaços</h1>
                    <p className="lc-subtitulo">Anúncios, aprovação e status de publicação.</p>
                </div>
                <button
                    type="button"
                    className="lc-btn lc-btn--primary lc-btn--lg"
                    onClick={() => navigate(ROTA_NOVO)}
                >
                    + Novo anúncio
                </button>
            </header>

            <section className="lc-stats lc-stats--espacos" aria-label="Filtros de cadastro">
                <Stat
                    label="Cadastrados"
                    valor={espacos.length}
                    dica={`${totalAtivos} ativo(s)`}
                    ativo={!filtro}
                    onClick={() => setFiltro("")}
                />
                <Stat
                    label="Aprovados"
                    valor={totalAprovados}
                    dica="Visíveis na busca"
                    ativo={filtro === "aprovados"}
                    onClick={() => setFiltro("aprovados")}
                />
                <Stat
                    label="Em análise"
                    valor={totalEmAnalise}
                    dica={totalRejeitados > 0 ? `${totalRejeitados} rejeitado(s)` : "Aguardando o admin"}
                    ativo={filtro === "analise"}
                    onClick={() => setFiltro("analise")}
                />
                {totalRejeitados > 0 ? (
                    <Stat
                        label="Rejeitados"
                        valor={totalRejeitados}
                        dica="Clique para filtrar"
                        alerta
                        ativo={filtro === "rejeitados"}
                        onClick={() => setFiltro("rejeitados")}
                    />
                ) : (
                    <Stat
                        label="Ativos"
                        valor={totalAtivos}
                        dica="Publicação ligada"
                        ativo={filtro === "ativos"}
                        onClick={() => setFiltro("ativos")}
                    />
                )}
            </section>

            <section className="lc-card">
                <div className="lc-card-cab">
                    <h2 className="lc-card-titulo">
                        Anúncios
                        <span className="lc-card-contador">{filtrados.length}</span>
                    </h2>
                    {filtro && (
                        <button type="button" className="lc-link" onClick={() => setFiltro("")}>
                            Limpar filtro
                        </button>
                    )}
                </div>

                {carregando ? (
                    <p className="lc-vazio">Carregando seus anúncios…</p>
                ) : erro ? (
                    <div className="lc-estado-erro" role="alert">
                        <p>{erro}</p>
                        <button type="button" className="lc-btn lc-btn--primary" onClick={carregar}>
                            Tentar novamente
                        </button>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="lc-espacos-vazio lc-vazio-ilustrado" aria-label="Sem espaços">
                        <h2>
                            {espacos.length === 0
                                ? "Nenhum espaço cadastrado"
                                : "Nenhum espaço neste filtro"}
                        </h2>
                        <p>
                            {espacos.length === 0
                                ? "Crie o primeiro anúncio para começar a receber pedidos."
                                : "Limpe o filtro ou escolha outra situação para ver seus anúncios."}
                        </p>
                        {espacos.length === 0 && (
                            <button type="button" className="lc-btn lc-btn--primary" onClick={() => navigate(ROTA_NOVO)}>
                                Criar primeiro anúncio
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="lc-espacos lc-espacos--fase5">
                        {filtrados.map((espaco, index) => (
                            <EspacoItem
                                key={espaco.id || index}
                                espaco={espaco}
                                proximoEvento={proximosPorEspaco[espaco.id]}
                                onAlternarStatus={handleAlternarStatus}
                                onEditar={(id) => navigate(rotaEditar(id))}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
