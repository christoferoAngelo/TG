import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import HeaderHome from "../home/components/HeaderHome";
import { useAuth } from "../../contexts/AuthContext";
import { antecedenciaSalva, interpretarRegras } from "../novo espaco/regrasTexto";
import { calcularTurnos, formatarMinutos, paraMinutos } from "../novo espaco/turnos";
import "./DetalhesEspaco.css";
import AnimatedContent from "../../components/bits/AnimatedContent";
import BlurText from "../../components/bits/BlurText";
import Carousel from "../../components/bits/Carousel";
import GradualBlur from "../../components/bits/GradualBlur";

const API = "http://localhost:8080/api";
const ROTA_LOGIN = "/login";

const hhmm = (t) => {
    if (!t) return "";
    if (Array.isArray(t)) return `${String(t[0]).padStart(2, "0")}:${String(t[1] ?? 0).padStart(2, "0")}`;
    return String(t).slice(0, 5);
};

const moeda = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const horas = (v) => `${String(Number(v)).replace(".", ",")} h`;

const hojeISO = () => dataMinimaISO(0);

/** Primeira data que o calendário pode oferecer: hoje + N dias. */
function dataMinimaISO(dias) {
    const n = Math.max(0, Number(dias) || 0);
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}

function comPonto(texto) {
    const limpo = String(texto || "").trim().replace(/\s+/g, " ");
    if (!limpo) return "";
    return /[.!?…]$/.test(limpo) ? limpo : `${limpo}.`;
}

function formatarISO(iso) {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function isoDia(ano, mes, dia) {
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function CalendarioReserva({ minima, valor, onEscolher }) {
    const base = valor && valor >= minima ? valor : minima;
    const [ano, setAno] = useState(() => Number(base.slice(0, 4)));
    const [mes, setMes] = useState(() => Number(base.slice(5, 7)));

    useEffect(() => {
        const proximo = valor && valor >= minima ? valor : minima;
        setAno(Number(proximo.slice(0, 4)));
        setMes(Number(proximo.slice(5, 7)));
    }, [minima, valor]);

    const offset = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const celulas = [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ];
    const mesAtual = isoDia(ano, mes, 1).slice(0, 7);
    const podeVoltar = mesAtual > minima.slice(0, 7);

    const mover = (delta) => {
        const data = new Date(ano, mes - 1 + delta, 1);
        setAno(data.getFullYear());
        setMes(data.getMonth() + 1);
    };

    return (
        <div className="dt-cal">
            <div className="dt-cal-nav">
                <button type="button" onClick={() => mover(-1)} disabled={!podeVoltar} aria-label="Mês anterior">
                    ‹
                </button>
                <strong>{MESES[mes - 1]} {ano}</strong>
                <button type="button" onClick={() => mover(1)} aria-label="Próximo mês">
                    ›
                </button>
            </div>
            <div className="dt-cal-grade" role="grid" aria-label="Data do evento">
                {DIAS_SEMANA.map((dia) => (
                    <span key={dia} className="dt-cal-semana">{dia}</span>
                ))}
                {celulas.map((dia, indice) => {
                    if (!dia) return <span key={`vazio-${indice}`} />;
                    const iso = isoDia(ano, mes, dia);
                    const bloqueado = iso < minima;
                    return (
                        <button
                            key={iso}
                            type="button"
                            role="gridcell"
                            className={`dt-cal-dia${iso === valor ? " dt-cal-dia--ativo" : ""}`}
                            disabled={bloqueado}
                            aria-disabled={bloqueado}
                            aria-pressed={iso === valor}
                            aria-label={bloqueado ? `${formatarISO(iso)}, indisponível` : formatarISO(iso)}
                            onClick={() => onEscolher(iso)}
                        >
                            {dia}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const chavePeriodo = (p) => (p.modalidade === "MEIO_PERIODO" ? `MEIO_PERIODO-${p.periodo}` : p.modalidade);
const rotuloPeriodo = (p) => (p.modalidade === "INTEGRAL" ? "Dia inteiro" : `Período ${p.periodo}`);

/** Mesma chave gravada no cadastro: "18h–22h". */
function chaveHorario(inicio, fim) {
    const a = paraMinutos(hhmm(inicio));
    const b = paraMinutos(hhmm(fim));
    if (a == null || b == null) return "";
    return `${formatarMinutos(a)}–${formatarMinutos(b)}`;
}

function extraDoHorario(adicionais, inicio, fim) {
    if (!adicionais) return 0;
    const chave = chaveHorario(inicio, fim);
    const valor = Number(adicionais[chave] ?? adicionais[chave.replaceAll("–", "-")]);
    return valor > 0 ? valor : 0;
}

export default function DetalhesEspaco() {
    const { id } = useParams();
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [espaco, setEspaco] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true);

    const [lightbox, setLightbox] = useState(null);

    // Reserva
    const [data, setData] = useState("");
    const [disp, setDisp] = useState(null);
    const [carregandoDisp, setCarregandoDisp] = useState(false);
    const [erroDisp, setErroDisp] = useState("");
    const [recarga, setRecarga] = useState(0);
    const [escolha, setEscolha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [observacao, setObservacao] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erroReserva, setErroReserva] = useState("");
    const [sucesso, setSucesso] = useState(false);

    const handlePesquisar = (termo) => {
        navigate(termo ? `/home?q=${encodeURIComponent(termo)}` : "/home");
    };

    /* ---------- carga de dados ---------- */

    useEffect(() => {
        setCarregando(true);
        fetch(`${API}/locadores/espacos/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar o espaço");
                return res.json();
            })
            .then(setEspaco)
            .catch((err) => {
                console.error("Erro:", err);
                setEspaco(null);
            })
            .finally(() => setCarregando(false));
    }, [id]);

    useEffect(() => {
        fetch(`${API}/reservas/espaco/${id}/avaliacoes`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar avaliações");
                return res.json();
            })
            .then((lista) => setAvaliacoes(Array.isArray(lista) ? lista : []))
            .catch((err) => console.error("Erro ao buscar avaliações:", err))
            .finally(() => setCarregandoAvaliacoes(false));
    }, [id]);

    const antecedenciaDias = antecedenciaSalva(espaco);
    const dataMinima = dataMinimaISO(antecedenciaDias);

    useEffect(() => {
        if (!data) {
            setDisp(null);
            setErroDisp("");
            return;
        }
        if (data < dataMinima) {
            setDisp(null);
            setEscolha("");
            setData("");
            setErroReserva(
                antecedenciaDias > 0
                    ? `Este espaço só aceita reservas com pelo menos ${antecedenciaDias} dia(s) de antecedência. A primeira data é ${formatarISO(dataMinima)}.`
                    : "A data do evento já passou."
            );
            return;
        }
        let ativo = true;
        setCarregandoDisp(true);
        setErroDisp("");
        setEscolha("");

        fetch(`${API}/reservas/espaco/${id}/disponibilidade?data=${data}`)
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error((await res.text()) || "Não foi possível consultar a disponibilidade.");
                }
                return res.json();
            })
            .then((d) => {
                if (!ativo) return;
                setDisp(d);
                const livres = (d?.periodos || []).filter((periodo) => periodo.disponivel);
                const personalizado = espaco?.permiteHorarioPersonalizado === true;
                const opcoes = livres.length + (personalizado ? 1 : 0);
                if (opcoes === 1) {
                    setEscolha(livres.length === 1 ? chavePeriodo(livres[0]) : "PERSONALIZADO");
                }
            })
            .catch((e) => {
                if (!ativo) return;
                setDisp(null);
                setErroDisp(e.message);
            })
            .finally(() => ativo && setCarregandoDisp(false));

        return () => {
            ativo = false;
        };
    }, [id, data, recarga, dataMinima, antecedenciaDias, espaco?.permiteHorarioPersonalizado]);

    /* ---------- fotos ---------- */

    const fotos = useMemo(() => {
        const lista = [];
        const inicios = [];
        (espaco?.ambientes || []).forEach((amb) => {
            inicios.push(lista.length);
            (amb.imagensUrls || []).forEach((url, i) => lista.push({ url, ambiente: amb.titulo, n: i + 1 }));
        });
        return { lista, inicios };
    }, [espaco]);

    const totalFotos = fotos.lista.length;
    const lightboxAberto = lightbox !== null;

    useEffect(() => {
        if (!lightboxAberto) return;
        const aoTeclar = (e) => {
            if (e.key === "Escape") setLightbox(null);
            if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % totalFotos);
            if (e.key === "ArrowLeft") setLightbox((i) => (i - 1 + totalFotos) % totalFotos);
        };
        window.addEventListener("keydown", aoTeclar);
        const anterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = anterior;
        };
    }, [lightboxAberto, totalFotos]);

    /* ---------- derivados calculados com Hooks (no topo) ---------- */

    const periodoAtual = disp?.periodos?.find((p) => chavePeriodo(p) === escolha);

    const adicionais = useMemo(
        () => interpretarRegras(espaco?.restricoesHorario || "").adicionais,
        [espaco]
    );

    const turnosComPreco = useMemo(() => {
        if (!espaco?.duracaoMaxHoras || espaco.permiteMeioPeriodo === false) return [];
        const { turnos } = calcularTurnos({
            abertura: hhmm(espaco.horarioAbertura),
            fechamento: hhmm(espaco.horarioFechamento),
            duracaoHoras: Number(espaco.duracaoMaxHoras),
            limpezaMin: Number(espaco.intervaloLimpezaMin ?? 0),
        });
        const base = Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria) || 0;
        return turnos.map((turno) => {
            const extra = Number(adicionais[turno.chave]) > 0 ? Number(adicionais[turno.chave]) : 0;
            return { ...turno, extra, total: base + extra };
        });
    }, [espaco, adicionais]);

    const precoAtual = useMemo(() => {
        if (!espaco) return { valor: 0, rotulo: "por diária", extra: 0, base: 0 };

        if (escolha === "PERSONALIZADO") {
            const valorHora = Number(espaco.valorHora || espaco.valorDiaria || 0);
            if (horaInicio && horaFim) {
                const [hIni, mIni] = horaInicio.split(":").map(Number);
                const [hFim, mFim] = horaFim.split(":").map(Number);
                const diffMinutos = (hFim * 60 + mFim) - (hIni * 60 + mIni);
                const horasTotais = diffMinutos > 0 ? diffMinutos / 60 : 0;
                return {
                    valor: horasTotais * valorHora,
                    rotulo: `para ${horasTotais.toFixed(1).replace(".", ",")}h (${moeda(valorHora)}/h)`,
                    extra: 0,
                    base: valorHora,
                };
            }
            return { valor: valorHora, rotulo: "por hora", extra: 0, base: valorHora };
        }

        if (periodoAtual?.modalidade === "MEIO_PERIODO") {
            const base = Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria) || 0;
            const extra = extraDoHorario(adicionais, periodoAtual.horaInicio, periodoAtual.horaFim);
            return {
                valor: base + extra,
                rotulo: extra > 0 ? "neste turno" : "por turno",
                extra,
                base,
            };
        }

        const soTurno = espaco.permiteMeioPeriodo !== false && espaco.permitePeriodoIntegral === false;
        if (soTurno) {
            const base = Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria) || 0;
            return { valor: base, rotulo: "por turno", extra: 0, base };
        }
        return { valor: Number(espaco.valorDiaria) || 0, rotulo: "por diária", extra: 0, base: Number(espaco.valorDiaria) || 0 };
    }, [escolha, periodoAtual, espaco, horaInicio, horaFim, adicionais]);

    /* ---------- reserva ---------- */

    const handleReservar = async (e) => {
        e.preventDefault();
        setErroReserva("");

        if (!usuarioLogado?.id) {
            navigate(ROTA_LOGIN, {
                state: { fundo: { pathname: location.pathname, search: location.search, hash: location.hash } }
            });
            return;
        }
        if (!data) return setErroReserva("Escolha a data do evento.");
        if (data < dataMinima) {
            return setErroReserva(
                antecedenciaDias > 0
                    ? `Este espaço só aceita reservas com pelo menos ${antecedenciaDias} dia(s) de antecedência.`
                    : "A data do evento já passou."
            );
        }
        if (!escolha) return setErroReserva("Escolha um período.");

        const corpo = {
            espacoId: Number(id),
            dataEvento: data,
            observacao: observacao.trim() || null,
        };

        let valorTotalCalculado = Number(espaco.valorDiaria);

        if (escolha === "PERSONALIZADO") {
            if (!horaInicio || !horaFim) return setErroReserva("Informe o horário de início e de fim.");
            corpo.modalidade = "PERSONALIZADO";
            corpo.horaInicio = horaInicio;
            corpo.horaFim = horaFim;

            const [hIni, mIni] = horaInicio.split(":").map(Number);
            const [hFim, mFim] = horaFim.split(":").map(Number);
            const diffMinutos = (hFim * 60 + mFim) - (hIni * 60 + mIni);
            const horasTotais = diffMinutos > 0 ? diffMinutos / 60 : 0;
            const valorHora = Number(espaco.valorHora || espaco.valorDiaria || 0);
            valorTotalCalculado = horasTotais * valorHora;
        } else {
            const periodo = disp.periodos.find((p) => chavePeriodo(p) === escolha);
            corpo.modalidade = periodo.modalidade;
            if (periodo.periodo) corpo.periodo = periodo.periodo;

            if (periodo.modalidade === "MEIO_PERIODO") {
                const base = Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria) || 0;
                valorTotalCalculado = base + extraDoHorario(adicionais, periodo.horaInicio, periodo.horaFim);
            } else {
                valorTotalCalculado = Number(espaco.valorDiaria);
            }
        }

        corpo.valorTotal = valorTotalCalculado;

        setEnviando(true);
        try {
            const response = await fetch(`${API}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Usuario-Id": usuarioLogado.id },
                body: JSON.stringify(corpo),
            });

            if (!response.ok) {
                throw new Error((await response.text()) || "Erro ao solicitar reserva.");
            }

            const criada = await response.json();

            if (espaco.aprovacaoInstantanea) {
                navigate("/pagamento", {
                    state: {
                        reservaId: criada.id,
                        nomeEspaco: espaco.titulo,
                        valorTotal: Number(valorTotalCalculado).toFixed(2),
                    },
                });
                return;
            }

            setSucesso(true);
            setData("");
            setObservacao("");
            setHoraInicio("");
            setHoraFim("");
            setRecarga((n) => n + 1);
        } catch (err) {
            console.error("Erro:", err);
            setErroReserva(err.message);
        } finally {
            setEnviando(false);
        }
    };

    /* ---------- estados de tela ---------- */

    if (carregando) {
        return (
            <div className="dt-page">
                <HeaderHome onSearch={handlePesquisar} />
                <div className="dt-estado">
                    <p>Carregando detalhes do espaço…</p>
                </div>
            </div>
        );
    }

    if (!espaco) {
        return (
            <div className="dt-page">
                <HeaderHome onSearch={handlePesquisar} />
                <div className="dt-estado">
                    <h2>Espaço não encontrado</h2>
                    <p>Ele pode ter sido removido ou estar indisponível no momento.</p>
                    <button type="button" className="dt-btn dt-btn--ghost" onClick={() => navigate(-1)}>
                        Voltar para a página anterior
                    </button>
                </div>
            </div>
        );
    }

    const instantanea = Boolean(espaco.aprovacaoInstantanea);
    const aceitaMeio = espaco.permiteMeioPeriodo !== false;
    const aceitaIntegral = espaco.permitePeriodoIntegral !== false;
    const aceitaPersonalizado = espaco.permiteHorarioPersonalizado === true;
    const formasDeLocacao = [
        aceitaIntegral && "Dia inteiro",
        aceitaMeio && "Meio período",
        aceitaPersonalizado && "Horário personalizado",
    ].filter(Boolean);

    const qtdHero = totalFotos >= 5 ? 5 : totalFotos >= 3 ? 3 : totalFotos;
    const endereco = [espaco.endereco?.bairro, espaco.endereco?.cidade].filter(Boolean).join(", ");
    const enderecoCompleto = espaco.endereco?.estado ? `${endereco} - ${espaco.endereco.estado}` : endereco;
    const nota = espaco.notaMedia ? Number(espaco.notaMedia) : null;
    const qtdAvaliacoes = espaco.quantidadeAvaliacoes || 0;
    const textoAvaliacoes = `${qtdAvaliacoes} avaliaç${qtdAvaliacoes === 1 ? "ão" : "ões"}`;

    return (
        <div className="dt-page">
            <main className="dt-container">
                <button type="button" className="dt-voltar" onClick={() => navigate(-1)}>
                    ‹ Voltar
                </button>

                <header className="dt-titulo">
                    <BlurText
                        text={espaco.titulo}
                        className="dt-titulo-anim"
                        animateBy="words"
                        effect="focus"
                        delay={60}
                        blur={8}
                        trigger="load"
                    />
                    <p className="dt-meta">
                        {nota ? (
                            <a href="#avaliacoes" className="dt-nota">
                                <span className="dt-estrela" aria-hidden="true">★</span>
                                <strong>{nota.toFixed(1)}</strong>
                                <span>{textoAvaliacoes}</span>
                            </a>
                        ) : (
                            <span className="dt-sem-nota">Ainda sem avaliações</span>
                        )}
                        {enderecoCompleto && <span className="dt-local">{enderecoCompleto}</span>}
                    </p>
                </header>

                {/* ---------- Galeria ---------- */}
                {totalFotos > 0 ? (
                    <section className={`dt-hero dt-hero--${qtdHero}`} aria-label="Fotos do espaço">
                        <GradualBlur position="bottom" height="4.5rem" strength={1.4} tint="var(--color-bg)" zIndex={2} />
                        {fotos.lista.slice(0, qtdHero).map((foto, i) => (
                            <button
                                type="button"
                                key={foto.url + i}
                                className="dt-hero-foto"
                                onClick={() => setLightbox(i)}
                                aria-label={`Ampliar foto: ${foto.ambiente}`}
                            >
                                <img src={foto.url} alt={`${foto.ambiente}, foto ${foto.n}`} />
                            </button>
                        ))}
                        {totalFotos > qtdHero && (
                            <button type="button" className="dt-hero-todas" onClick={() => setLightbox(0)}>
                                Ver todas as {totalFotos} fotos
                            </button>
                        )}
                    </section>
                ) : (
                    <div className="dt-hero-vazio">Este anúncio ainda não tem fotos.</div>
                )}

                <div className="dt-layout">
                    <div className="dt-principal">
                        {/* ---------- Sobre ---------- */}
                        <section className="dt-secao">
                            <h2>Sobre o espaço</h2>
                            <p className="dt-descricao">{espaco.descricao}</p>

                            <dl className="dt-fatos">
                                <div>
                                    <dt>Capacidade</dt>
                                    <dd>Até {espaco.capacidadePessoas} pessoas</dd>
                                </div>
                                {espaco.horarioAbertura && espaco.horarioFechamento && (
                                    <div>
                                        <dt>Funcionamento</dt>
                                        <dd>
                                            {hhmm(espaco.horarioAbertura)} às {hhmm(espaco.horarioFechamento)}
                                        </dd>
                                    </div>
                                )}
                                {espaco.duracaoMaxHoras && (
                                    <div>
                                        <dt>Duração máxima</dt>
                                        <dd>{horas(espaco.duracaoMaxHoras)} por locação</dd>
                                    </div>
                                )}
                                {espaco.intervaloLimpezaMin > 0 && (
                                    <div>
                                        <dt>Limpeza entre eventos</dt>
                                        <dd>{espaco.intervaloLimpezaMin} minutos</dd>
                                    </div>
                                )}
                                {antecedenciaDias > 0 && (
                                    <div>
                                        <dt>Antecedência</dt>
                                        <dd>Mínimo de {antecedenciaDias} dia{antecedenciaDias === 1 ? "" : "s"}</dd>
                                    </div>
                                )}
                                {formasDeLocacao.length > 0 && (
                                    <div className="dt-fato-largo">
                                        <dt>Formas de locação</dt>
                                        <dd>{formasDeLocacao.join(", ")}</dd>
                                    </div>
                                )}
                            </dl>

                            {(() => {
                                const regras = interpretarRegras(espaco.restricoesHorario);
                                const acrescimos = Object.entries(regras.adicionais || {});
                                const blocos = [
                                    regras.tiposEvento.length > 0 && {
                                        titulo: "Eventos aceitos",
                                        texto: regras.tiposEvento.map(comPonto).join(" "),
                                    },
                                    regras.regrasSom && { titulo: "Regras gerais e de som", texto: comPonto(regras.regrasSom) },
                                    regras.regrasLimpeza && { titulo: "Limpeza e danos", texto: comPonto(regras.regrasLimpeza) },
                                    regras.regrasAcesso && { titulo: "Segurança e acesso", texto: comPonto(regras.regrasAcesso) },
                                    acrescimos.length > 0 && {
                                        titulo: "Acréscimos por turno",
                                        texto: acrescimos
                                            .map(([nome, valor]) => `${nome}: ${moeda(valor)}.`)
                                            .join(" "),
                                    },
                                ].filter(Boolean);
                                if (blocos.length === 0) return null;
                                return (
                                    <div className="dt-regras">
                                        <h2>Regras e restrições</h2>
                                        {blocos.map((bloco) => (
                                            <section key={bloco.titulo}>
                                                <h3>{bloco.titulo}</h3>
                                                <p>{bloco.texto}</p>
                                            </section>
                                        ))}
                                    </div>
                                );
                            })()}
                        </section>

                        {/* ---------- Cômodos ---------- */}
                        {espaco.ambientes?.length > 0 && (
                            <AnimatedContent className="dt-secao" container=".sidebar-content" distance={20} duration={0.5} blur={1} once>
                                <h2>Conheça cada ambiente</h2>
                                <div className="dt-ambientes">
                                    {espaco.ambientes.map((amb, idx) => (
                                        <article key={amb.id ?? idx} className="dt-ambiente">
                                            <div className="dt-ambiente-info">
                                                <h3>{amb.titulo}</h3>
                                                {amb.descricao && <p>{amb.descricao}</p>}
                                            </div>
                                            {amb.imagensUrls?.length > 0 ? (
                                                <Carousel
                                                    className="dt-carrossel"
                                                    items={amb.imagensUrls.map((url, i) => (
                                                        <button
                                                            type="button"
                                                            key={url + i}
                                                            className="dt-galeria-foto"
                                                            onClick={() => setLightbox(fotos.inicios[idx] + i)}
                                                            aria-label={`Ampliar ${amb.titulo}, foto ${i + 1}`}
                                                        >
                                                            <img src={url} alt={`${amb.titulo}, foto ${i + 1}`} />
                                                        </button>
                                                    ))}
                                                    baseWidth="100%"
                                                    aspectRatio={1.45}
                                                    effect="slide"
                                                    arrows
                                                    loop={amb.imagensUrls.length > 1}
                                                    draggable
                                                    indicator="dots"
                                                    theme="light"
                                                    frame={false}
                                                    radius={14}
                                                />
                                            ) : (
                                                <p className="dt-vazio">Sem fotos para este cômodo.</p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </AnimatedContent>
                        )}

                        {/* ---------- Características ---------- */}
                        {espaco.caracteristicas?.length > 0 && (
                            <section className="dt-secao">
                                <h2>O que o espaço oferece</h2>
                                <ul className="dt-tags">
                                    {espaco.caracteristicas.map((c) => (
                                        <li key={c.id}>{c.nome}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* ---------- Avaliações ---------- */}
                        <section className="dt-secao" id="avaliacoes">
                            <h2>
                                Avaliações
                                {nota && (
                                    <span className="dt-titulo-nota">
                                        <span className="dt-estrela" aria-hidden="true">★</span> {nota.toFixed(1)} ({qtdAvaliacoes})
                                    </span>
                                )}
                            </h2>

                            {carregandoAvaliacoes ? (
                                <p className="dt-vazio">Carregando avaliações…</p>
                            ) : avaliacoes.length === 0 ? (
                                <p className="dt-vazio">Este espaço ainda não recebeu nenhuma avaliação.</p>
                            ) : (
                                <div className="dt-avaliacoes">
                                    {avaliacoes.map((av, i) => (
                                        <article key={i} className="dt-avaliacao">
                                            <header>
                                                <strong>{av.nomeLocatario}</strong>
                                                <time>{new Date(av.dataAvaliacao).toLocaleDateString("pt-BR")}</time>
                                            </header>
                                            <p className="dt-estrelas" aria-label={`Nota ${av.nota} de 5`}>
                                                {"★".repeat(av.nota)}
                                                <span className="dt-estrelas-vazias">{"★".repeat(5 - av.nota)}</span>
                                            </p>
                                            {av.comentario && <p className="dt-comentario">{av.comentario}</p>}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ---------- Cartão de reserva ---------- */}
                    <aside className="dt-lateral">
                        <form className="dt-reserva" id="reserva" onSubmit={handleReservar} noValidate>
                            <p className="dt-preco">
                                <strong>{moeda(precoAtual.valor)}</strong> <span>{precoAtual.rotulo}</span>
                            </p>
                            {precoAtual.extra > 0 && (
                                <p className="dt-preco-detalhe">
                                    {moeda(precoAtual.base)} + {moeda(precoAtual.extra)} de acréscimo neste horário
                                </p>
                            )}
                            {!periodoAtual && turnosComPreco.some((t) => t.extra > 0) && (
                                <ul className="dt-turnos-preco">
                                    {turnosComPreco.map((turno) => (
                                        <li key={turno.chave}>
                                            <span>{turno.inicio} às {turno.fim}</span>
                                            <span>
                                                <strong>{moeda(turno.total)}</strong>
                                                {turno.extra > 0 && <em>+ {moeda(turno.extra)}</em>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {sucesso && (
                                <div className="dt-sucesso" role="status">
                                    <strong>Solicitação enviada.</strong>
                                    <p>O locador vai analisar o pedido e responder em breve.</p>
                                </div>
                            )}

                            <div className="dt-campo">
                                <span id="dt-data-rotulo">Data do evento</span>
                                <CalendarioReserva
                                    minima={dataMinima}
                                    valor={data}
                                    onEscolher={(iso) => {
                                        if (iso < dataMinima) return;
                                        setSucesso(false);
                                        setErroReserva("");
                                        setData(iso);
                                    }}
                                />
                                {antecedenciaDias > 0 && (
                                    <p className="dt-dica">
                                        Reservas a partir de {formatarISO(dataMinima)}. Os dias anteriores ficam bloqueados.
                                    </p>
                                )}
                            </div>

                            {carregandoDisp && <p className="dt-dica">Consultando horários…</p>}
                            {erroDisp && <p className="dt-erro">{erroDisp}</p>}

                            {disp && (
                                <fieldset className="dt-periodos">
                                    <legend>Período</legend>

                                    {disp.periodos.length === 0 && !disp.aceitaHorarioPersonalizado && (
                                        <p className="dt-dica">Este espaço não tem períodos disponíveis para reserva.</p>
                                    )}

                                    {disp.periodos.map((p) => {
                                        const chave = chavePeriodo(p);
                                        const basePeriodo = p.modalidade === "MEIO_PERIODO"
                                            ? Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria) || 0
                                            : Number(espaco.valorDiaria) || 0;
                                        const extra = p.modalidade === "MEIO_PERIODO"
                                            ? extraDoHorario(adicionais, p.horaInicio, p.horaFim)
                                            : 0;
                                        return (
                                            <label
                                                key={chave}
                                                className={`dt-periodo${escolha === chave ? " dt-periodo--ativo" : ""}${!p.disponivel ? " dt-periodo--off" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="periodo"
                                                    value={chave}
                                                    disabled={!p.disponivel}
                                                    checked={escolha === chave}
                                                    onChange={() => {
                                                        setEscolha(chave);
                                                        setErroReserva("");
                                                    }}
                                                />
                                                <span className="dt-periodo-nome">{rotuloPeriodo(p)}</span>
                                                {p.disponivel && (
                                                    <span className="dt-periodo-preco">{moeda(basePeriodo + extra)}</span>
                                                )}
                                                <span className="dt-periodo-hora">
                                                    {hhmm(p.horaInicio)} às {hhmm(p.horaFim)}
                                                    {extra > 0 && <span className="dt-periodo-extra"> · + {moeda(extra)}</span>}
                                                </span>
                                                {!p.disponivel && <span className="dt-periodo-status">Indisponível</span>}
                                            </label>
                                        );
                                    })}

                                    {disp.aceitaHorarioPersonalizado && (
                                        <label
                                            className={`dt-periodo${escolha === "PERSONALIZADO" ? " dt-periodo--ativo" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="periodo"
                                                value="PERSONALIZADO"
                                                checked={escolha === "PERSONALIZADO"}
                                                onChange={() => {
                                                    setEscolha("PERSONALIZADO");
                                                    setErroReserva("");
                                                }}
                                            />
                                            <span className="dt-periodo-nome">Horário personalizado</span>
                                            <span className="dt-periodo-hora">
                                                Entre {hhmm(disp.horarioAbertura)} e {hhmm(disp.horarioFechamento)}
                                            </span>
                                        </label>
                                    )}

                                    {escolha === "PERSONALIZADO" && (
                                        <div className="dt-horas">
                                            <div className="dt-campo">
                                                <label htmlFor="dt-ini">Início</label>
                                                <input
                                                    id="dt-ini"
                                                    type="time"
                                                    className="dt-input"
                                                    min={hhmm(disp.horarioAbertura)}
                                                    max={hhmm(disp.horarioFechamento)}
                                                    value={horaInicio}
                                                    onChange={(e) => setHoraInicio(e.target.value)}
                                                />
                                            </div>
                                            <div className="dt-campo">
                                                <label htmlFor="dt-fim">Fim</label>
                                                <input
                                                    id="dt-fim"
                                                    type="time"
                                                    className="dt-input"
                                                    min={hhmm(disp.horarioAbertura)}
                                                    max={hhmm(disp.horarioFechamento)}
                                                    value={horaFim}
                                                    onChange={(e) => setHoraFim(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {disp.ocupados?.length > 0 && (
                                        <p className="dt-dica">
                                            Já reservado neste dia:{" "}
                                            {disp.ocupados.map((o) => `${hhmm(o.horaInicio)} às ${hhmm(o.horaFim)}`).join(", ")}.
                                        </p>
                                    )}
                                </fieldset>
                            )}

                            <div className="dt-campo">
                                <label htmlFor="dt-obs">
                                    Observações <span className="dt-opcional">(opcional)</span>
                                </label>
                                <textarea
                                    id="dt-obs"
                                    rows={3}
                                    className="dt-input"
                                    maxLength={500}
                                    placeholder="Ex: Aniversário para 50 pessoas"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                />
                            </div>

                            {erroReserva && <p className="dt-erro" role="alert">{erroReserva}</p>}

                            <button
                                type="submit"
                                className="dt-btn dt-btn--primario dt-btn--largo"
                                disabled={enviando || (Boolean(data) && data < dataMinima)}
                            >
                                {enviando
                                    ? "Enviando…"
                                    : instantanea
                                        ? (usuarioLogado?.id ? "Ir para o pagamento" : "Entrar para pagar")
                                        : (usuarioLogado?.id ? "Enviar pedido de reserva" : "Entrar para reservar")}
                            </button>
                            <p className="dt-dica dt-centro">
                                {instantanea
                                    ? "A reserva é confirmada na hora. O próximo passo é o pagamento."
                                    : "O locador analisa o pedido antes de confirmar."}
                            </p>
                        </form>
                    </aside>
                </div>
            </main>

            {/* Barra de reserva no celular */}
            <div className="dt-barra-mobile">
                <p>
                    <strong>{moeda(precoAtual.valor)}</strong> <span>{precoAtual.rotulo}</span>
                </p>
                <a href="#reserva" className="dt-btn dt-btn--primario">
                    {instantanea ? "Pagar" : "Reservar"}
                </a>
            </div>

            {/* ---------- Visualizador de fotos ---------- */}
            {lightboxAberto && fotos.lista[lightbox] && (
                <div
                    className="dt-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Fotos do espaço"
                    onClick={() => setLightbox(null)}
                >
                    <button type="button" className="dt-lb-fechar" onClick={() => setLightbox(null)} aria-label="Fechar">
                        ×
                    </button>
                    {totalFotos > 1 && (
                        <button
                            type="button"
                            className="dt-lb-nav dt-lb-prev"
                            aria-label="Foto anterior"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox((i) => (i - 1 + totalFotos) % totalFotos);
                            }}
                        >
                            ‹
                        </button>
                    )}
                    <figure onClick={(e) => e.stopPropagation()}>
                        <img src={fotos.lista[lightbox].url} alt={`${fotos.lista[lightbox].ambiente}, foto ${fotos.lista[lightbox].n}`} />
                        <figcaption>
                            {fotos.lista[lightbox].ambiente}: foto {lightbox + 1} de {totalFotos}
                        </figcaption>
                    </figure>
                    {totalFotos > 1 && (
                        <button
                            type="button"
                            className="dt-lb-nav dt-lb-next"
                            aria-label="Próxima foto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox((i) => (i + 1) % totalFotos);
                            }}
                        >
                            ›
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}